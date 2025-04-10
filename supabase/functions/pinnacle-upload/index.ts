
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

    // Validate that required columns exist
    const requiredColumns = ['Part No', 'Description', 'Stock Holding'];
    const firstRow = data[0] as Record<string, any>;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
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

    // Begin transaction to replace all stock data
    // 1. Delete existing records using SQL function
    await supabase.rpc('execute_sql', { sql: 'DELETE FROM pinnacle_stock' });

    // 2. Prepare stock items for insertion
    const stockItems = data.map((row: any) => ({
      part_no: row['Part No'],
      product_group: row['Prod Group'] || null,
      description: row['Description'] || null,
      bin_location: row['Bin Locations'] || null,
      stock_quantity: row['Stock Holding'] ? parseFloat(row['Stock Holding']) : null,
      average_cost: row['Av Cost'] ? parseFloat(row['Av Cost']) : null,
      total_average_cost: row['Tot Av Cost'] ? parseFloat(row['Tot Av Cost']) : null,
      cost: row['Cost'] ? parseFloat(row['Cost']) : null,
      total_cost: row['Tot Cost'] ? parseFloat(row['Tot Cost']) : null,
      retail_price: row['Retail'] ? parseFloat(row['Retail']) : null,
      total_retail: row['Tot Retail'] ? parseFloat(row['Tot Retail']) : null,
    }));

    // Insert records in batches
    const batchSize = 100;
    for (let i = 0; i < stockItems.length; i += batchSize) {
      const batch = stockItems.slice(i, i + batchSize);
      
      // Create an INSERT statement for each batch item
      for (const item of batch) {
        const columns = Object.keys(item).filter(key => item[key] !== null);
        const values = columns.map(col => {
          const val = item[col];
          return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
        });
        
        const columnsStr = columns.join(', ');
        const valuesStr = values.join(', ');
        
        await supabase.rpc('execute_sql', {
          sql: `INSERT INTO pinnacle_stock (id, ${columnsStr}) VALUES (gen_random_uuid(), ${valuesStr})`
        });
      }
    }

    // 3. Record upload history using SQL function
    await supabase.rpc('execute_sql', {
      sql: `INSERT INTO pinnacle_upload_history (filename, records_count, status) 
            VALUES ('${file.name.replace(/'/g, "''")}', ${stockItems.length}, 'success')`
    });

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
      
      await supabase.rpc('execute_sql', {
        sql: `INSERT INTO pinnacle_upload_history 
              (filename, records_count, status, error_message) 
              VALUES ('failed_upload.xlsx', 0, 'error', '${(error instanceof Error ? error.message : 'Unknown error').replace(/'/g, "''")}')`
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
