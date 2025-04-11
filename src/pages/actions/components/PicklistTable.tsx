
import React from "react";
import { PicklistOrder as PicklistOrderType } from "../types/picklistTypes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import PicklistOrderComponent from "./PicklistOrderComponent";

interface PicklistTableProps {
  orders: PicklistOrderType[];
  refreshData: () => void;
}

const PicklistTable = ({ orders, refreshData }: PicklistTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-800/50">
            <TableHead className="w-[10%]"></TableHead>
            <TableHead className="w-[35%]"></TableHead>
            <TableHead className="w-[5%] text-center"></TableHead>
            <TableHead className="w-[8%] text-center"></TableHead>
            <TableHead className="text-green-500 w-[8%] text-center">Stock</TableHead>
            <TableHead className="text-green-500 w-[8%]">Location</TableHead>
            <TableHead className="text-green-500 w-[8%]">Cost</TableHead>
            <TableHead className="w-[10%]"></TableHead>
            <TableHead className="w-[8%]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <React.Fragment key={`order-group-${order.id}`}>
              <PicklistOrderComponent order={order} refreshData={refreshData} />
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

export default PicklistTable;
