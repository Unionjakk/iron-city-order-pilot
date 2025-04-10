
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx')) {
      return new Response(JSON.stringify({ error: 'Invalid file format. Please upload an Excel (.xlsx) file.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Reading Excel file:", file.name, "Size:", file.size);

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return new Response(JSON.stringify({ error: 'Excel file is empty or has no valid data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Excel data loaded, first row:", JSON.stringify(data[0]));

    // Validate that required columns exist
    const firstRow = data[0] as Record<string, any>;
    
    // Check for required columns with multiple possible names
    const requiredColumnMappings = {
      'Part No': ['Part No', 'PartNo', 'Part_No', 'Part Number'],
      'Description': ['Description', 'Desc', 'Item Description'],
      'Stock Holding': ['Stock Holding', 'Stock', 'Stock Qty', 'Quantity']
    };
    
    const missingColumns = [];
    
    for (const [requiredColumn, possibleNames] of Object.entries(requiredColumnMappings)) {
      const hasColumn = possibleNames.some(name => {
        const exists = name in firstRow;
        if (exists) console.log(`Found column "${name}" for required "${requiredColumn}"`);
        return exists;
      });
      
      if (!hasColumn) {
        missingColumns.push(requiredColumn);
      }
    }
    
    if (missingColumns.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Deleting existing stock data");
    
    // 1. Delete existing records
    const { error: deleteError } = await supabase
      .from('pinnacle_stock')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error("Error deleting existing data:", deleteError);
      throw deleteError;
    }

    // Helper function to get value from multiple possible column names
    const getValue = (row: Record<string, any>, possibleNames: string[], defaultValue: any = null) => {
      for (const name of possibleNames) {
        if (name in row) {
          return row[name];
        }
      }
      return defaultValue;
    };

    console.log("Preparing stock items for insertion");
    
    // 2. Prepare stock items for insertion
    const stockItems = data.map((row: any) => {
      // Find the right column names for each required field
      const partNo = getValue(row, ['Part No', 'PartNo', 'Part_No', 'Part Number']);
      const productGroup = getValue(row, ['Prod Group', 'Product Group', 'ProdGroup', 'Group']);
      const description = getValue(row, ['Description', 'Desc', 'Item Description']);
      const binLocation = getValue(row, ['Bin Locations', 'Bin Location', 'Bin Location 1', 'Bin']);
      const stockQuantity = getValue(row, ['Stock Holding', 'Stock', 'Stock Qty', 'Quantity']);
      const avgCost = getValue(row, ['Av Cost', 'Average Cost', 'Avg Cost']);
      const totalAvgCost = getValue(row, ['Tot Av Cost', 'Total Av Cost', 'Total Average Cost']);
      const cost = getValue(row, ['Cost', 'Unit Cost']);
      const totalCost = getValue(row, ['Tot Cost', 'Total Cost']);
      const retailPrice = getValue(row, ['Retail', 'Retail Price']);
      const totalRetail = getValue(row, ['Tot Retail', 'Total Retail']);
      
      // Convert numeric values to numbers
      return {
        part_no: partNo,
        product_group: productGroup,
        description: description,
        bin_location: binLocation,
        stock_quantity: stockQuantity !== null ? parseFloat(stockQuantity) : null,
        average_cost: avgCost !== null ? parseFloat(avgCost) : null,
        total_average_cost: totalAvgCost !== null ? parseFloat(totalAvgCost) : null,
        cost: cost !== null ? parseFloat(cost) : null,
        total_cost: totalCost !== null ? parseFloat(totalCost) : null,
        retail_price: retailPrice !== null ? parseFloat(retailPrice) : null,
        total_retail: totalRetail !== null ? parseFloat(totalRetail) : null,
      };
    });

    console.log(`Inserting ${stockItems.length} stock items`);
    
    // 3. Insert all items in a single batch (more efficient)
    const { error: insertError } = await supabase
      .from('pinnacle_stock')
      .insert(stockItems);
    
    if (insertError) {
      console.error("Error inserting stock data:", insertError);
      throw insertError;
    }

    console.log("Recording upload history");
    
    // 4. Record upload history
    const { error: historyError } = await supabase
      .from('pinnacle_upload_history')
      .insert({
        filename: file.name,
        records_count: stockItems.length,
        status: 'success'
      });
    
    if (historyError) {
      console.error("Error recording upload history:", historyError);
      // Non-fatal error, continue
    }

    console.log("Upload completed successfully");

    return new Response(JSON.stringify({ 
      message: 'File processed successfully', 
      recordsCount: stockItems.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    
    // Try to log error to upload history
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('pinnacle_upload_history')
        .insert({
          filename: 'failed_upload.xlsx',
          records_count: 0,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
    } catch (logError) {
      console.error('Error logging upload failure:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Error processing file', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
