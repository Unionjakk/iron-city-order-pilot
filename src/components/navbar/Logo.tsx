
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Link to="/" className="text-xl font-bold text-orange-500">Iron City Shopify</Link>
    </div>
  );
};

export default Logo;
