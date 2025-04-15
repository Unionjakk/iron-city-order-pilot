
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BatchLocationUpdateV2 from "@/components/shopify/BatchLocationUpdateV2";

const BatchLocationPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Batch Location Update V2</h1>
        <p className="text-orange-400/80">Update location information using V2 implementation</p>
      </div>
      
      <BatchLocationUpdateV2 />
    </div>
  );
};

export default BatchLocationPage;
