
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type PinnacleStatsCardProps = {
  stockCount: number | null;
  lastUpload: string | null;
  isLoading: boolean;
};

const PinnacleStatsCard = ({ stockCount, lastUpload, isLoading }: PinnacleStatsCardProps) => {
  return (
    <div className="mt-8 p-4 bg-zinc-800/60 rounded-lg border border-zinc-700">
      <h3 className="font-medium text-orange-400 mb-2">Current Data Status</h3>
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-zinc-400 text-sm">Stock Items:</span>
            <span className="ml-2 text-zinc-200 font-semibold">
              {stockCount !== null ? stockCount.toLocaleString() : 'None'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 text-sm">Last Upload:</span>
            <span className="ml-2 text-zinc-200 font-semibold">{lastUpload || 'None'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinnacleStatsCard;
