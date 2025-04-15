
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AllOpenOrdersImportV2Card from "../components/v2/AllOpenOrdersImportV2Card";

const ImportAllPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-orange-500">Import All Open Orders V2</h1>
        <p className="text-orange-400/80">Import open orders with V2 implementation</p>
      </div>
      
      <AllOpenOrdersImportV2Card />
    </div>
  );
};

export default ImportAllPage;
