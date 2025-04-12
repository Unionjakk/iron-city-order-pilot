
import React from "react";
import { PicklistOrder } from "../types/picklistTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import OrderedOrderComponent from "./OrderedOrderComponent";

interface OrderedTableProps {
  orders: PicklistOrder[];
  refreshData: () => void;
}

const OrderedTable = ({ orders, refreshData }: OrderedTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50">
            <TableHead className="w-[10%]">SKU</TableHead>
            <TableHead className="w-[30%]">Item</TableHead>
            <TableHead className="w-[5%] text-center">Qty</TableHead>
            <TableHead className="w-[8%] text-center">Price</TableHead>
            <TableHead className="text-green-500 w-[8%] text-center">Stock</TableHead>
            <TableHead className="text-green-500 w-[8%]">Location</TableHead>
            <TableHead className="text-green-500 w-[8%]">Cost</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="w-[13%]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <React.Fragment key={`order-group-${order.id}`}>
              <OrderedOrderComponent order={order} refreshData={refreshData} />
              <TableRow className="h-4">
                <TableCell colSpan={9} className="p-0">
                  <Separator className="bg-zinc-800/50" />
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderedTable;
