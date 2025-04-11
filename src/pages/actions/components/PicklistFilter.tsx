
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
    <div className="p-4 flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order #, SKU or item name..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilter()}
        />
      </div>
      <Button onClick={handleFilter} type="button">
        Search
      </Button>
    </div>
  );
};

export default PicklistFilter;
