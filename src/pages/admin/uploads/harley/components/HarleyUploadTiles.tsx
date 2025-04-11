
import { Card } from '@/components/ui/card';
import { AlertCircle, FileSpreadsheet, FileText, ListChecks, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UploadTile {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  disabled?: boolean;
}

const HarleyUploadTiles = () => {
  // Define our upload tiles
  const uploadTiles: UploadTile[] = [
    {
      title: 'Open Orders Upload',
      description: 'Upload open orders from H-D NET',
      icon: <FileText className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-orders',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Open Order Check In',
      description: 'Check in and exclude open orders',
      icon: <ListChecks className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-order-check-in',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Order Lines Upload',
      description: 'Upload order line items from H-D NET',
      icon: <FileSpreadsheet className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/order-lines',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Open Lines Check In',
      description: 'Check in and exclude line items',
      icon: <AlertCircle className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-lines-check-in',
      color: 'from-orange-600/20 to-amber-600/20',
    },
    {
      title: 'Backorders Upload',
      description: 'Upload backorder data from H-D NET',
      icon: <Package className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/backorders',
      color: 'from-orange-600/20 to-amber-600/20',
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-medium text-orange-500 mb-4">Upload & Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uploadTiles.map((tile) => (
          <UploadTileCard key={tile.title} tile={tile} />
        ))}
      </div>
    </div>
  );
};

// Separate component for the tile card
const UploadTileCard = ({ tile }: { tile: UploadTile }) => {
  return (
    <Link 
      to={tile.link} 
      className={tile.disabled ? 'pointer-events-none opacity-70' : ''}
    >
      <Card className="h-full border-zinc-800 bg-gradient-to-br hover:shadow-lg hover:border-orange-500/50 transition-all duration-200 overflow-hidden">
        <div className={`p-6 bg-gradient-to-br ${tile.color} flex flex-col items-center justify-center text-center min-h-[180px]`}>
          <div className="flex flex-col items-center text-center space-y-2">
            {tile.icon}
            <h3 className="font-medium text-zinc-200 mt-2">{tile.title}</h3>
            <p className="text-sm text-zinc-400">{tile.description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default HarleyUploadTiles;
