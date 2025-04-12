export interface PicklistOrder {
  id: string;
  shopify_order_id: string;
  shopify_order_number: string | null;
  customer_name: string;
  customer_email: string | null;
  created_at: string;
  items: PicklistOrderItem[];
}

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
  location_name: string;
  // Stock data
  in_stock: boolean;
  stock_quantity: number | null;
  bin_location: string | null;
  cost: number | null;
  // Progress data
  progress: string | null;
  notes: string | null;
  hd_orderlinecombo: string | null;
  status: string | null;
  dealer_po_number: string | null;
  // Quantity tracking
  quantity_required?: number;
  quantity_picked?: number;
  is_partial?: boolean;
}

export interface PicklistDataResult {
  orders: PicklistOrder[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  debugInfo: PicklistDebugInfo;
}

export interface PicklistDebugInfo {
  orderCount: number;
  lineItemCount: number;
  progressItemCount: number;
  finalOrderCount: number;
  finalItemCount: number;
  orderStatus: string[];
  fetchStartTime: string;
  endTime: string;
  timeTaken: number;
  progressFetchResult?: string;
  ordersFetchResult?: string;
  lineItemsFetchResult?: string;
  allLineItems?: number;
  error?: string;
  progressItems?: any[];
  ordersData?: any[];
  lineItemsData?: any[];
}
