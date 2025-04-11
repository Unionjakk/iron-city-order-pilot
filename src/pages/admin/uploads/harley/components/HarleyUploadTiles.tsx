
import { Card } from '@/components/ui/card';
import { UploadCloud, FileSpreadsheet, List, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const HarleyUploadTiles = () => {
  const tiles = [
    {
      title: 'Open Orders Upload',
      description: 'Upload Open Orders data from H-D NET',
      icon: <FileSpreadsheet className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-orders',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Open Order Check In',
      description: 'Check in open orders and exclude open orders',
      icon: <Check className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-order-check-in',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Order Lines Upload',
      description: 'Upload Order Line Items data from H-D NET',
      icon: <List className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/order-lines',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Backorders Upload',
      description: 'Upload Backorder data from H-D NET',
      icon: <UploadCloud className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/backorders',
      color: 'from-orange-600/20 to-amber-600/20',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((tile) => (
        <Link to={tile.link} key={tile.title}>
          <Card className="h-full border-zinc-800 bg-gradient-to-br hover:shadow-lg hover:border-orange-500/50 transition-all duration-200 overflow-hidden">
            <div className={`p-6 bg-gradient-to-br ${tile.color}`}>
              <div className="flex flex-col items-center text-center space-y-2">
                {tile.icon}
                <h3 className="font-medium text-zinc-200 mt-2">{tile.title}</h3>
                <p className="text-xs text-zinc-400">{tile.description}</p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default HarleyUploadTiles;
