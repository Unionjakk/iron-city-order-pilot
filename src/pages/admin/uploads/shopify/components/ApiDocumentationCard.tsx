
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ApiDocumentation from '@/components/shopify/ApiDocumentation';

const ApiDocumentationCard = () => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500">API Integration Details</CardTitle>
        <CardDescription className="text-zinc-400">Technical information about the Shopify integration</CardDescription>
      </CardHeader>
      <CardContent>
        <ApiDocumentation />
      </CardContent>
    </Card>
  );
};

export default ApiDocumentationCard;
