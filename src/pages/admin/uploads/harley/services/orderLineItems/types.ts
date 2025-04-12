
import { OrderLineItem } from '../../utils/parser';

export interface UploadStats {
  processed: number;
  replaced: number;
  errors: number;
}

export interface OrderProcessingResult {
  replacedLineNumbers: string[];
  processedCount: number;
  errorsCount: number;
}
