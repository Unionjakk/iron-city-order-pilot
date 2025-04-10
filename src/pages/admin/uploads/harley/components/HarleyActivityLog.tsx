
import { Clock, Loader } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/components/shopify/utils/dateUtils';
import { HDUploadHistory } from '../types/harleyTypes';

type HarleyActivityLogProps = {
  uploads: HDUploadHistory[];
  isLoading: boolean;
};

const HarleyActivityLog = ({ uploads, isLoading }: HarleyActivityLogProps) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-500">
          <Clock className="mr-2 h-5 w-5" />
          Recent Activity Log
        </CardTitle>
        <CardDescription className="text-zinc-400">Recent upload activity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : uploads.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 px-2 text-zinc-400">Type</th>
                    <th className="text-left py-2 px-2 text-zinc-400">Filename</th>
                    <th className="text-left py-2 px-2 text-zinc-400">Date</th>
                    <th className="text-left py-2 px-2 text-zinc-400">Items</th>
                    <th className="text-left py-2 px-2 text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr key={upload.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                      <td className="py-2 px-2">
                        <span className="capitalize">{upload.upload_type?.replace('_', ' ')}</span>
                      </td>
                      <td className="py-2 px-2 text-xs text-zinc-400">{upload.filename}</td>
                      <td className="py-2 px-2">{formatDate(upload.upload_date)}</td>
                      <td className="py-2 px-2">{upload.items_count}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          upload.status === 'success' 
                            ? 'bg-green-900/30 text-green-400' 
                            : upload.status === 'partial_success'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-red-900/30 text-red-400'
                        }`}>
                          {upload.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-zinc-400">
              Recent upload activity will be displayed here once data imports begin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HarleyActivityLog;
