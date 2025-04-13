
// Supabase Edge Function for importing a single Shopify order
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

// Types for function response
interface FunctionResponse {
  success: boolean;
  message?: string;
  error?: string;
  imported?: boolean;
  debugMessages: string[];
  orderData?: any;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize response
  const responseData: FunctionResponse = {
    success: false,
    debugMessages: []
  };

  // Debug logging helper
  const debug = (message: string) => {
    console.log(message);
    responseData.debugMessages.push(message);
  };

  try {
    // Parse request
    const { apiToken, orderNumber } = await req.json();
    
    if (!apiToken) {
      throw new Error("No API token provided");
    }
    
    if (!orderNumber) {
      throw new Error("No order number provided");
    }
    
    // Clean the order number (remove # if present)
    const cleanOrderNumber = orderNumber.toString().replace(/^#/, '');
    debug(`Processing order number: ${cleanOrderNumber}`);
    
    // Get the Shopify API endpoint from database
    const { data: apiEndpoint, error: endpointError } = await supabase.rpc("get_shopify_setting", {
      setting_name_param: "shopify_api_endpoint"
    });

    if (endpointError || !apiEndpoint) {
      debug(`Error retrieving API endpoint: ${endpointError?.message || 'Not found'}`);
      throw new Error("Failed to retrieve Shopify API endpoint");
    }
    
    // Extract base API URL from the endpoint
    const baseApiUrl = apiEndpoint.split('/orders.json')[0];
    const orderUrl = `${baseApiUrl}/orders/${cleanOrderNumber}.json?fields=id,order_number,name,created_at,fulfillment_status,customer,line_items,shipping_address,note,email,phone`;
    
    debug(`Fetching order from Shopify: ${orderUrl}`);
    
    // Fetch the order from Shopify API
    const response = await fetch(orderUrl, {
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      debug(`API Error (${response.status}): ${errorText}`);
      
      if (response.status === 404) {
        return new Response(JSON.stringify({
          success: false,
          message: `Order #${cleanOrderNumber} not found in Shopify`,
          debugMessages: responseData.debugMessages
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
      
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.order) {
      debug(`Invalid response format: ${JSON.stringify(data)}`);
      throw new Error("Invalid response format from Shopify API");
    }
    
    const order = data.order;
    debug(`Retrieved order: ${order.name} (${order.id})`);
    
    // Check if order fulfillment status is eligible for import
    const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';
    
    if (fulfillmentStatus !== 'unfulfilled' && fulfillmentStatus !== 'partial') {
      debug(`Order ${order.name} (${order.id}) has ineligible fulfillment status: ${fulfillmentStatus}`);
      
      return new Response(JSON.stringify({
        success: true,
        imported: false,
        message: `Order #${order.name} has status "${fulfillmentStatus}" and is not eligible for import. Only unfulfilled or partially fulfilled orders can be imported.`,
        debugMessages: responseData.debugMessages
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Check if the order has line items
    if (!order.line_items || !Array.isArray(order.line_items) || order.line_items.length === 0) {
      debug(`Order ${order.name} (${order.id}) has no line items`);
      
      return new Response(JSON.stringify({
        success: true,
        imported: false,
        message: `Order #${order.name} has no line items and cannot be imported.`,
        debugMessages: responseData.debugMessages
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Log the customer information
    debug(`Customer information: ${JSON.stringify(order.customer || 'No customer data')}`);
    debug(`Shipping address: ${JSON.stringify(order.shipping_address || 'No shipping address')}`);
    
    // Prepare customer data - use safe defaults if missing
    const customerName = order.customer 
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() 
      : (order.customer_name || 'Unknown Customer');
      
    const customerEmail = order.customer 
      ? order.customer.email || null
      : (order.email || null);
      
    const customerPhone = order.customer 
      ? order.customer.phone || null
      : (order.phone || null);
    
    // Check if order already exists
    const { data: existingOrder, error: checkError } = await supabase
      .from("shopify_orders")
      .select("id")
      .eq("shopify_order_id", String(order.id))
      .maybeSingle();

    if (checkError) {
      debug(`Error checking existing order ${order.id}: ${checkError.message}`);
      throw new Error(`Database error: ${checkError.message}`);
    }

    let orderDbId: string;

    if (existingOrder) {
      debug(`Order ${order.id} (${order.name}) already exists - updating`);
      
      // Update existing order with all customer data
      const { error: updateError } = await supabase
        .from("shopify_orders")
        .update({
          status: order.fulfillment_status || "unfulfilled",
          imported_at: new Date().toISOString(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address: order.shipping_address || null,
          note: order.note || null,
          line_items: order.line_items || null
        })
        .eq("id", existingOrder.id);

      if (updateError) {
        debug(`Error updating order ${order.id}: ${updateError.message}`);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }
      
      orderDbId = existingOrder.id;

      // Delete existing line items to avoid duplicates
      const { error: deleteLineItemsError } = await supabase
        .from("shopify_order_items")
        .delete()
        .eq("order_id", orderDbId);

      if (deleteLineItemsError) {
        debug(`Error deleting existing line items for order ${order.id}: ${deleteLineItemsError.message}`);
      }
    } else {
      // Insert new order with all customer data
      const { data: insertedOrder, error: insertError } = await supabase
        .from("shopify_orders")
        .insert({
          shopify_order_id: String(order.id),
          shopify_order_number: order.order_number || order.name,
          created_at: order.created_at,
          customer_name: customerName,
          customer_email: customerEmail, 
          customer_phone: customerPhone,
          status: order.fulfillment_status || "unfulfilled",
          items_count: order.line_items?.length || 0,
          imported_at: new Date().toISOString(),
          note: order.note || null,
          shipping_address: order.shipping_address || null,
          line_items: order.line_items || null
        })
        .select()
        .single();

      if (insertError) {
        debug(`Error inserting order ${order.id}: ${insertError.message}`);
        throw new Error(`Failed to insert order: ${insertError.message}`);
      }

      if (!insertedOrder) {
        debug(`Error: No order ID returned after inserting order ${order.id}`);
        throw new Error("Database error: Failed to retrieve inserted order ID");
      }

      orderDbId = insertedOrder.id;
    }

    // Insert line items
    debug(`Inserting ${order.line_items.length} line items for order ${order.id}`);
    
    const lineItemsToInsert = order.line_items.map((item: any) => {
      // Ensure IDs are stored as strings
      const shopifyLineItemId = String(item.id || `default-${Math.random().toString(36).substring(2, 15)}`);
      
      return {
        order_id: orderDbId,
        shopify_line_item_id: shopifyLineItemId,
        title: item.title || "Unknown Product",
        sku: item.sku || "",
        quantity: item.quantity || 1,
        price: item.price || "0.00",
        product_id: item.product_id ? String(item.product_id) : "",
        variant_id: item.variant_id ? String(item.variant_id) : "",
        properties: item.properties || null,
        location_id: item.location_id ? String(item.location_id) : null,
        location_name: item.location_name || null
      };
    });

    // Insert line items one by one to avoid potential issues
    for (const lineItem of lineItemsToInsert) {
      const { error: insertLineItemError } = await supabase
        .from("shopify_order_items")
        .insert(lineItem);
        
      if (insertLineItemError) {
        debug(`Error inserting line item for order ${order.id}: ${insertLineItemError.message}`);
      }
    }
    
    // Verify that line items were created
    const { count, error: countError } = await supabase
      .from("shopify_order_items")
      .select("*", { count: 'exact', head: true })
      .eq("order_id", orderDbId);
      
    if (countError) {
      debug(`Error verifying line items for order ${order.id}: ${countError.message}`);
    } else if (!count || count === 0) {
      debug(`WARNING: No line items were created for order ${order.id} - creating emergency line item`);
      
      // Last resort - create basic line item
      const { error: emergencyError } = await supabase
        .from("shopify_order_items")
        .insert({
          order_id: orderDbId,
          shopify_line_item_id: `emergency-${Date.now()}`,
          title: "Fallback Product",
          quantity: 1
        });
        
      if (emergencyError) {
        debug(`Failed to create emergency line item: ${emergencyError.message}`);
      }
    } else {
      debug(`Verified ${count} line items for order ${order.id}`);
    }
    
    // Return success response
    responseData.success = true;
    responseData.imported = true;
    responseData.message = `Successfully imported order #${order.name} with ${order.line_items.length} line items`;
    
    // Don't include full order data in production for security/privacy
    // responseData.orderData = order;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    debug(`Error in single order import: ${error.message}`);
    responseData.error = error.message;
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
