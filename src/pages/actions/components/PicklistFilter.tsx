
import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PicklistFilterProps {
  onSearch?: (query: string) => void;
}

const PicklistFilter: React.FC<PicklistFilterProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-orange-500/50" />
        <Input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order #, SKU or item name..." 
          className="pl-9 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full"
        />
      </div>
      <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
        Search
      </Button>
    </form>
  );
};

export default PicklistFilter;

