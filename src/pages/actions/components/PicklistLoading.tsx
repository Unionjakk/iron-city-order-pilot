
import { TableCell, TableRow, Table, TableBody, TableHead, TableHeader } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const PicklistLoading = () => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <Skeleton className="h-10 w-full max-w-lg bg-zinc-800/50" />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50">
            <TableHead className="text-orange-500 w-24"></TableHead>
            <TableHead className="text-orange-500">Date</TableHead>
            <TableHead className="text-orange-500"></TableHead>
            <TableHead className="text-orange-500">Qty</TableHead>
            <TableHead className="text-orange-500">Price</TableHead>
            <TableHead className="text-orange-500">Stock</TableHead>
            <TableHead className="text-orange-500">Location</TableHead>
            <TableHead className="text-orange-500">Cost</TableHead>
            <TableHead className="text-orange-500">Action</TableHead>
            <TableHead className="text-orange-500"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(2).fill(0).map((_, orderIndex) => (
            <>
              <TableRow key={`order-loading-${orderIndex}`} className="bg-zinc-800/20">
                <TableCell colSpan={10} className="py-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-40 bg-zinc-800" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                      <Skeleton className="h-5 w-24 bg-zinc-800" />
                      <Skeleton className="h-5 w-32 bg-zinc-800" />
                      <Skeleton className="h-5 w-48 bg-zinc-800" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
              {Array(3).fill(0).map((_, itemIndex) => (
                <>
                  <TableRow key={`item-loading-${orderIndex}-${itemIndex}`} className="hover:bg-zinc-800/30">
                    <TableCell><Skeleton className="h-5 w-16 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-4 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full bg-zinc-800" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-16 bg-zinc-800" /></TableCell>
                  </TableRow>
                  <TableRow className="border-none">
                    <TableCell colSpan={9}></TableCell>
                    <TableCell className="pt-0 pb-4">
                      <Skeleton className="h-16 w-full bg-zinc-800" />
                    </TableCell>
                  </TableRow>
                </>
              ))}
              <TableRow className="h-4">
                <TableCell colSpan={10} className="p-0">
                  <Separator className="bg-zinc-800/50" />
                </TableCell>
              </TableRow>
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PicklistLoading;
