
// This Edge Function restores unfulfilled orders from the archive back to the active orders table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supabase client setup
const supabaseUrl = "https://hbmismnzmocjazaiicdu.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Main function to restore archived orders
async function restoreArchivedOrders(onlyUnfulfilled = true) {
  console.log(`Starting restore of archived orders (onlyUnfulfilled=${onlyUnfulfilled})`);
  
  try {
    // Query for orders to restore
    const query = supabase
      .from('shopify_archived_orders')
      .select('*');
      
    // If we only want unfulfilled orders, add that filter
    if (onlyUnfulfilled) {
      query.eq('status', 'unfulfilled');
    }
    
    const { data: archivedOrders, error: queryError } = await query;
    
    if (queryError) {
      console.error('Error fetching archived orders:', queryError);
      return { success: false, error: queryError.message };
    }
    
    if (!archivedOrders || archivedOrders.length === 0) {
      console.log('No archived orders found to restore');
      return { success: true, restored: 0 };
    }
    
    console.log(`Found ${archivedOrders.length} archived orders to restore`);
    
    // Track successfully restored orders
    let restoredCount = 0;
    
    // Process each archived order
    for (const archivedOrder of archivedOrders) {
      try {
        // First check if this order already exists in the active orders table
        const { data: existingOrder, error: checkError } = await supabase
          .from('shopify_orders')
          .select('id')
          .eq('shopify_order_id', archivedOrder.shopify_order_id)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking for existing order ${archivedOrder.shopify_order_id}:`, checkError);
          continue;
        }
        
        if (existingOrder) {
          console.log(`Order ${archivedOrder.shopify_order_id} already exists in active orders, skipping`);
          continue;
        }
        
        // Get archived line items for this order
        const { data: archivedLineItems, error: lineItemsError } = await supabase
          .from('shopify_archived_order_items')
          .select('*')
          .eq('archived_order_id', archivedOrder.id);
          
        if (lineItemsError) {
          console.error(`Error fetching line items for archived order ${archivedOrder.id}:`, lineItemsError);
        }
        
        // Create a new record in the active orders table
        const orderToRestore = {
          shopify_order_id: archivedOrder.shopify_order_id,
          shopify_order_number: archivedOrder.shopify_order_number,
          created_at: archivedOrder.created_at,
          customer_name: archivedOrder.customer_name,
          customer_email: archivedOrder.customer_email,
          customer_phone: archivedOrder.customer_phone,
          items_count: archivedOrder.items_count,
          shipping_address: archivedOrder.shipping_address,
          note: archivedOrder.note,
          status: archivedOrder.status,
          location_id: archivedOrder.location_id,
          location_name: archivedOrder.location_name,
          metadata: archivedOrder.metadata,
          imported_at: new Date().toISOString(), // Use current timestamp for restored
        };
        
        const { data: insertedOrder, error: insertError } = await supabase
          .from('shopify_orders')
          .insert(orderToRestore)
          .select('id')
          .single();
          
        if (insertError) {
          console.error(`Error restoring archived order ${archivedOrder.id}:`, insertError);
          continue;
        }
        
        // Now restore line items if we have them
        if (archivedLineItems && archivedLineItems.length > 0) {
          const lineItemsToRestore = archivedLineItems.map(item => ({
            order_id: insertedOrder.id,
            shopify_line_item_id: item.shopify_line_item_id,
            sku: item.sku,
            product_id: item.product_id,
            variant_id: item.variant_id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            properties: item.properties
          }));
          
          const { error: restoreItemsError } = await supabase
            .from('shopify_order_items')
            .insert(lineItemsToRestore);
            
          if (restoreItemsError) {
            console.error(`Error restoring line items for order ${archivedOrder.id}:`, restoreItemsError);
          }
        }
        
        // Delete the archived order and its line items
        if (archivedLineItems && archivedLineItems.length > 0) {
          const { error: deleteItemsError } = await supabase
            .from('shopify_archived_order_items')
            .delete()
            .eq('archived_order_id', archivedOrder.id);
            
          if (deleteItemsError) {
            console.error(`Error deleting archived line items for order ${archivedOrder.id}:`, deleteItemsError);
          }
        }
        
        const { error: deleteOrderError } = await supabase
          .from('shopify_archived_orders')
          .delete()
          .eq('id', archivedOrder.id);
          
        if (deleteOrderError) {
          console.error(`Error deleting archived order ${archivedOrder.id}:`, deleteOrderError);
        }
        
        restoredCount++;
        console.log(`Successfully restored order ${archivedOrder.shopify_order_id} (${restoredCount}/${archivedOrders.length})`);
      } catch (error) {
        console.error(`Error processing archived order ${archivedOrder.id}:`, error);
      }
    }
    
    console.log(`Completed restoring ${restoredCount} orders from archive`);
    return { success: true, restored: restoredCount };
  } catch (error) {
    console.error('Error in restore process:', error);
    return { success: false, error: error.message || 'Unknown error during restore' };
  }
}

// Request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      const onlyUnfulfilled = body.onlyUnfulfilled !== false; // Default to true
      
      console.log(`Restore request received (onlyUnfulfilled=${onlyUnfulfilled})`);
      const result = await restoreArchivedOrders(onlyUnfulfilled);
      
      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Only POST requests are supported" }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in request handler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal Server Error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
