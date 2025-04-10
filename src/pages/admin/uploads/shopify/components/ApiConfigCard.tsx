
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import ApiTokenFormComponent from '@/components/shopify/ApiTokenForm';

interface ApiConfigCardProps {
  isLoading: boolean;
  hasToken: boolean;
  maskedToken: string;
  setHasToken: (hasToken: boolean) => void;
  setMaskedToken: (maskedToken: string) => void;
}

const ApiConfigCard = ({ 
  isLoading, 
  hasToken, 
  maskedToken, 
  setHasToken, 
  setMaskedToken 
}: ApiConfigCardProps) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-orange-500 flex items-center">
          <Shield className="mr-2 h-5 w-5" /> Shopify API Configuration
        </CardTitle>
        <CardDescription className="text-zinc-400">Securely connect to your Shopify store</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-zinc-400">
            Loading API configuration...
          </div>
        ) : (
          <ApiTokenFormComponent 
            hasToken={hasToken} 
            maskedToken={maskedToken} 
            setHasToken={setHasToken} 
            setMaskedToken={setMaskedToken} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ApiConfigCard;
