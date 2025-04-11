
/**
 * Type definitions for the picklist feature
 */

export interface PicklistOrderItem {
  id: string;
  order_id: string;
  shopify_line_item_id: string;
  sku: string;
  title: string;
  quantity: number;
  price: number | null;
  created_at: string;
  location_id: string;
  location_name: string | null;
  // Pinnacle stock data
  in_stock: boolean;
  stock_quantity: number | null;
  bin_location: string | null;
  cost: number | null;
  // Progress tracking
  progress: string | null;
  notes: string | null;
  // Picked quantity
  pickedQuantity?: number;
}

export interface PicklistOrder {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  customer_name: string;
  customer_email: string | null;
  created_at: string;
  items: PicklistOrderItem[];
}

export interface PicklistDebugInfo {
  orderCount: number;
  lineItemCount: number;
  progressItemCount: number;
  finalOrderCount: number;
  finalItemCount: number;
  orderStatus: any[];
  fetchStartTime: string;
  endTime?: string;
  timeTaken?: number;
  [key: string]: any;
}

export interface PicklistDataResult {
  orders: PicklistOrder[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  debugInfo: PicklistDebugInfo;
}
