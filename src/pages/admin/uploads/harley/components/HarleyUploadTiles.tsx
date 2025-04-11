
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UploadCloud, FileSpreadsheet, List, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const HarleyUploadTiles = () => {
  // Define tiles with grouping metadata
  const tiles = [
    {
      title: 'Open Orders Upload',
      description: 'Upload Open Orders data from H-D NET',
      icon: <FileSpreadsheet className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-orders',
      color: 'from-orange-600/20 to-amber-600/20',
      group: 'orders',
      order: 1,
    },
    {
      title: 'Open Order Check In',
      description: 'Check in open orders and exclude open orders',
      icon: <Check className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-order-check-in',
      color: 'from-orange-600/20 to-amber-600/20',
      group: 'orders',
      order: 2,
    },
    {
      title: 'Order Lines Upload',
      description: 'Upload Order Line Items data from H-D NET',
      icon: <List className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/order-lines',
      color: 'from-orange-600/20 to-amber-600/20',
      group: 'lines',
      order: 1,
    },
    {
      title: 'Open Lines Check In',
      description: 'Check in and exclude line items',
      icon: <AlertCircle className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/open-lines-check-in',
      color: 'from-orange-600/20 to-amber-600/20',
      group: 'lines',
      order: 2,
      disabled: true,
    },
    {
      title: 'Backorders Upload',
      description: 'Upload Backorder data from H-D NET',
      icon: <UploadCloud className="h-8 w-8 text-orange-500" />,
      link: '/admin/uploads/harley/backorders',
      color: 'from-orange-600/20 to-amber-600/20',
      group: 'backorders',
      order: 1,
    }
  ];

  // Group the tiles
  const ordersTiles = tiles.filter(tile => tile.group === 'orders').sort((a, b) => a.order - b.order);
  const linesTiles = tiles.filter(tile => tile.group === 'lines').sort((a, b) => a.order - b.order);
  const backordersTiles = tiles.filter(tile => tile.group === 'backorders').sort((a, b) => a.order - b.order);

  const TileItem = ({ tile }: { tile: typeof tiles[0] }) => (
    <Link 
      to={tile.link} 
      key={tile.title} 
      className={tile.disabled ? 'pointer-events-none opacity-70' : ''}
    >
      <Card className="h-full border-zinc-800 bg-gradient-to-br hover:shadow-lg hover:border-orange-500/50 transition-all duration-200 overflow-hidden">
        <div className={`p-6 bg-gradient-to-br ${tile.color} flex flex-col items-center justify-center text-center min-h-[180px]`}>
          <div className="flex flex-col items-center text-center space-y-2">
            {tile.icon}
            <h3 className="font-medium text-zinc-200 mt-2">{tile.title}</h3>
            <p className="text-xs text-zinc-400">{tile.description}</p>
            {tile.disabled && (
              <span className="text-xs px-2 py-1 bg-zinc-800 text-orange-400 rounded-full">Coming Soon</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  const GroupContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-orange-400">{title}</h3>
        <Separator className="flex-grow bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <GroupContainer title="Open Orders Management">
        {ordersTiles.map((tile) => (
          <TileItem key={tile.title} tile={tile} />
        ))}
      </GroupContainer>

      <GroupContainer title="Order Lines Management">
        {linesTiles.map((tile) => (
          <TileItem key={tile.title} tile={tile} />
        ))}
      </GroupContainer>

      <GroupContainer title="Backorders Management">
        {backordersTiles.map((tile) => (
          <TileItem key={tile.title} tile={tile} />
        ))}
      </GroupContainer>
    </div>
  );
};

export default HarleyUploadTiles;
