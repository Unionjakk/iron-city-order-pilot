
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Shield className="h-6 w-6 text-orange-500 fill-orange-500/20" />
      <Link to="/" className="text-xl font-bold text-orange-500">Leeds Harley Shopify</Link>
    </div>
  );
};

export default Logo;
