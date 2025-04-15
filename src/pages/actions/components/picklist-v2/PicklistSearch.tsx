
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PicklistSearchProps {
  onSearch: (query: string) => void;
}

const PicklistSearch: React.FC<PicklistSearchProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Update the search on change
  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  // Clear the search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search by order number, customer, SKU, or product name..."
          className="pl-9 pr-9 bg-zinc-800/30 border-zinc-700 focus:border-orange-500 text-zinc-300"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 text-zinc-500 hover:text-zinc-300"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PicklistSearch;
