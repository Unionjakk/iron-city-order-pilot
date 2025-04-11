
import { TableCell, TableRow, Table, TableBody, TableHead, TableHeader } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const PicklistLoading = () => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <Skeleton className="h-8 w-full max-w-sm" />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Order</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Stock</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Location</TableHead>
            <TableHead className="bg-green-50 dark:bg-green-900/20">Cost</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Action</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Notes</TableHead>
            <TableHead className="bg-amber-50 dark:bg-amber-900/20">Submit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-8" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell className="bg-green-50 dark:bg-green-900/20">
                <Skeleton className="h-5 w-12" />
              </TableCell>
              <TableCell className="bg-green-50 dark:bg-green-900/20">
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="bg-green-50 dark:bg-green-900/20">
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                <Skeleton className="h-8 w-full" />
              </TableCell>
              <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                <Skeleton className="h-16 w-full" />
              </TableCell>
              <TableCell className="bg-amber-50 dark:bg-amber-900/20">
                <Skeleton className="h-9 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PicklistLoading;
