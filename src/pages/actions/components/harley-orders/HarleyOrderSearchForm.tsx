
import React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HarleyOrderSearchFormProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const HarleyOrderSearchForm: React.FC<HarleyOrderSearchFormProps> = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isLoading
}) => {
  return (
    <form onSubmit={onSearch} className="flex gap-2 mt-2">
      <Input
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        placeholder="Search by SKU"
        className="flex-grow bg-zinc-800 border-zinc-700 text-zinc-300"
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
        Search
      </Button>
    </form>
  );
};

export default HarleyOrderSearchForm;
