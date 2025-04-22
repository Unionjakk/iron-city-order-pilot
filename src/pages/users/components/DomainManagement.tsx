
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserX } from 'lucide-react';

interface DomainManagementProps {
  domains: string[];
  onAddDomain: (domain: string) => void;
  onRemoveDomain: (domain: string) => void;
}

const DomainManagement = ({ domains, onAddDomain, onRemoveDomain }: DomainManagementProps) => {
  const [newDomain, setNewDomain] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Restrictions</CardTitle>
        <CardDescription>Only allow registrations from specific email domains</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="domain.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex h-10 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1"
            />
            <Button 
              onClick={() => {
                onAddDomain(newDomain);
                setNewDomain('');
              }} 
              className="bg-orange-500 hover:bg-orange-600"
            >
              Add Domain
            </Button>
          </div>
          
          <Separator className="bg-zinc-800" />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-300">Allowed Domains</h3>
            {domains.length > 0 ? (
              <ul className="space-y-2">
                {domains.map((domain) => (
                  <li key={domain} className="flex items-center justify-between px-3 py-2 bg-zinc-800/40 rounded-md">
                    <span className="text-zinc-300">{domain}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      onClick={() => onRemoveDomain(domain)}
                      disabled={domains.length <= 1}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm">No domains added yet. All email domains will be allowed to register.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainManagement;
