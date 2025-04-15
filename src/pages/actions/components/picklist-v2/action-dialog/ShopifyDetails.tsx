
import React from 'react';
import ShopifyLogo from '../ShopifyLogo';

interface ShopifyDetailsProps {
  orderNumber: string;
  sku: string;
  title: string;
  quantity: number;
  priceExVat: number | null;
}

const ShopifyDetails = ({ orderNumber, sku, title, quantity, priceExVat }: ShopifyDetailsProps) => {
  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return `£${value.toFixed(2)}`;
  };

  return (
    <div className="bg-zinc-800/30 p-4 rounded-md">
      <div className="flex justify-center mb-4">
        <ShopifyLogo className="h-8 w-auto" />
      </div>
      <div className="space-y-3">
        <div>
          <span className="text-orange-400 font-medium">Order Number:</span>
          <span className="text-zinc-300 ml-2">{orderNumber}</span>
        </div>
        <div>
          <span className="text-orange-400 font-medium">SKU:</span>
          <span className="text-zinc-300 ml-2">{sku}</span>
        </div>
        <div>
          <span className="text-orange-400 font-medium">Item Description:</span>
          <div className="text-zinc-300 mt-1">{title}</div>
        </div>
        <div>
          <span className="text-orange-400 font-medium">Quantity Required:</span>
          <span className="text-zinc-300 ml-2">{quantity}</span>
        </div>
        <div>
          <span className="text-orange-400 font-medium">Price Sold For:</span>
          <span className="text-zinc-300 ml-2">
            {priceExVat !== null ? (
              <>
                {formatCurrency(priceExVat)}
                <span className="text-xs text-zinc-500 ml-1">(ex VAT)</span>
              </>
            ) : (
              "N/A"
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShopifyDetails;
