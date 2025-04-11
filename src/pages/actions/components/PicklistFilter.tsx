
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PicklistFilter = () => {
  const [search, setSearch] = useState("");
  
  // Future enhancement: implement filtering logic
  const handleFilter = () => {
    console.log("Filtering with:", search);
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-orange-500/60" />
        <Input
          placeholder="Search by order #, SKU or item name..."
          className="pl-8 border-zinc-700 bg-zinc-800/50 text-zinc-300 placeholder:text-zinc-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilter()}
        />
      </div>
      <Button 
        onClick={handleFilter} 
        type="button"
        className="button-primary"
      >
        Search
      </Button>
    </div>
  );
};

export default PicklistFilter;
