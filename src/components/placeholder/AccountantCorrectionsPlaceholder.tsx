
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const AccountantCorrectionsPlaceholder = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          Accountant Corrections
        </h1>
        <p className="text-orange-400/80 mt-2">Pinnacle correction tools for accounting</p>
      </div>

      <Card className="bg-zinc-800 border-zinc-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-zinc-100">Coming Soon</CardTitle>
          <CardDescription className="text-zinc-400">
            This feature is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-zinc-700/50 rounded-lg p-6 text-center">
            <Calculator className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-zinc-100 mb-2">
              Accountant Corrections Tool
            </h3>
            <p className="text-zinc-400 mb-4">
              This report will be for the accountant to make corrections to Pinnacle.
              We're working hard to bring this feature to you soon.
            </p>
            <div className="inline-block bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
              Under Development
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountantCorrectionsPlaceholder;
