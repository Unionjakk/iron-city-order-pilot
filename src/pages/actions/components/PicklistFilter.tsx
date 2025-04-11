
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PicklistFilterProps {
  onSearch?: (query: string) => void;
}

const PicklistFilter: React.FC<PicklistFilterProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);

  // Auto-search as user types with debounce
  useEffect(() => {
    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    if (isTyping) {
      const timer = setTimeout(() => {
        if (onSearch) {
          onSearch(searchQuery);
        }
        setIsTyping(false);
      }, 500); // 500ms debounce
      
      setTypingTimer(timer);
    }
    
    return () => {
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [searchQuery, isTyping, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsTyping(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-orange-500/50" />
        <Input 
          type="text" 
          value={searchQuery}
          onChange={handleChange}
          placeholder="Search by order #, SKU or item name..." 
          className="pl-9 border-zinc-700 bg-zinc-800/50 text-zinc-300 w-full"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-orange-500"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
        Search
      </Button>
    </form>
  );
};

export default PicklistFilter;
