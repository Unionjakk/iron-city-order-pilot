
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ProductionWarningAlert = () => {
  return (
    <Alert className="bg-zinc-800/60 border-amber-500/50">
      <AlertTriangle className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-500">Production System</AlertTitle>
      <AlertDescription className="text-zinc-300">
        This is a real production system connected to the live Shopify store. All actions here will affect the actual store data.
      </AlertDescription>
    </Alert>
  );
};

export default ProductionWarningAlert;
