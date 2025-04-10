
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { read, utils } from 'xlsx';
import formidable from 'formidable';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Disable body parsing, we'll handle the form data ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse form with formidable
    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file as formidable.File;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type
    if (!file.mimetype?.includes('spreadsheet') && !file.originalFilename?.endsWith('.xlsx')) {
      return res.status(400).json({ message: 'Invalid file format. Please upload an Excel (.xlsx) file.' });
    }

    // Read Excel file
    const buffer = fs.readFileSync(file.filepath);
    const workbook = read(buffer, { type: 'buffer' });
    
    // Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convert to JSON
    const data = utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty or has no valid data' });
    }

    // Validate that required columns exist
    const requiredColumns = ['Part No', 'Description', 'Stock Holding'];
    const firstRow = data[0] as Record<string, any>;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        message: `Missing required columns: ${missingColumns.join(', ')}` 
      });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Begin transaction to replace all stock data
    // 1. Delete existing records
    await supabase.from('pinnacle_stock').delete().neq('id', 'none');

    // 2. Insert new records
    const stockItems = data.map((row: any) => ({
      id: uuidv4(),
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
      last_updated: new Date().toISOString(),
    }));

    // Insert in batches to avoid exceeding payload limits
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < stockItems.length; i += batchSize) {
      const batch = stockItems.slice(i, i + batchSize);
      batches.push(batch);
    }

    for (const batch of batches) {
      const { error } = await supabase.from('pinnacle_stock').insert(batch);
      if (error) throw error;
    }

    // 3. Record upload history
    await supabase.from('pinnacle_upload_history').insert({
      filename: file.originalFilename || 'unknown.xlsx',
      records_count: stockItems.length,
      status: 'success',
      user_id: req.headers['x-user-id'] as string,  // Assuming you pass user ID in headers
    });

    return res.status(200).json({ 
      message: 'File processed successfully', 
      recordsCount: stockItems.length 
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    
    // Try to log error to upload history
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('pinnacle_upload_history').insert({
        filename: 'failed_upload.xlsx',
        records_count: 0,
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: req.headers['x-user-id'] as string,
      });
    } catch (logError) {
      console.error('Error logging upload failure:', logError);
    }
    
    return res.status(500).json({ 
      message: 'Error processing file', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
