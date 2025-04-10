
// Type definition for HD stats
export type HDStats = {
  totalOrders: number;
  ordersWithoutLineItems: number;
  backorderItems: number;
  lastOpenOrdersUpload: string | null;
  lastLineItemsUpload: string | null;
  lastBackordersUpload: string | null;
};

// Type definition for upload history
export type HDUploadHistory = {
  id: string;
  upload_type: string;
  filename: string;
  upload_date: string;
  items_count: number;
  status: string;
};
