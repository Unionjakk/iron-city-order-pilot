
export interface DragAndDropOrderItem {
  id: string;
  orderId: string;
  shopifyOrderId: string;
  orderNumber: string | null;
  customerName: string;
  createdAt: string;
  sku: string | null;
  lineItemId: string;
  title: string;
  quantity: number;
  price: number | null;
  // Stock data
  inStock: boolean;
  stockQuantity: number | null;
  binLocation: string | null;
  cost: number | null;
  // Progress data
  progress: string;
  notes: string | null;
  hd_orderlinecombo: string | null;
  status: string | null;
  dealer_po_number: string | null;
  // Quantity tracking
  quantityRequired: number;
  quantityPicked: number;
  isPartial: boolean;
}

export interface DragAndDropColumn {
  id: string;
  title: string;
  items: DragAndDropOrderItem[];
}

export interface ProgressUpdatePayload {
  shopifyOrderId: string;
  sku: string | null;
  progress: string;
  notes?: string | null;
  dealer_po_number?: string | null;
  quantityPicked?: number;
  isPartial?: boolean;
}
