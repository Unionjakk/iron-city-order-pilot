
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-4 text-center">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-zinc-400">
          <div>
            <h3 className="text-orange-400 text-sm font-medium mb-2">Contact</h3>
            <p className="text-xs">dale.gillespie@opusmotorgroup.co.uk</p>
            <p className="text-xs">07769787513</p>
          </div>
          <div>
            <h3 className="text-orange-400 text-sm font-medium mb-2">Policies</h3>
            <p className="text-xs">Privacy Policy</p>
            <p className="text-xs">Terms of Service</p>
          </div>
          <div>
            <h3 className="text-orange-400 text-sm font-medium mb-2">About</h3>
            <p className="text-xs">Leeds Harley Shopify is a comprehensive order management system for Leeds Harley-Davidson.</p>
          </div>
        </div>
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-zinc-500 text-sm">© {currentYear} Leeds Harley-Davidson. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
