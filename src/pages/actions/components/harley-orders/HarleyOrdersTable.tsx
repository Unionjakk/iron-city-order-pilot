
import React from "react";
import { formatDate } from "../../../utils/dateUtils";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface HarleyOrderMatch {
  hd_order_number: string;
  part_number: string;
  dealer_po_number: string | null;
  order_quantity: number | null;
  matched_quantity: number | null;
  status: string | null;
  hd_orderlinecombo: string | null;
  order_date: string | null;
  expected_arrival_dealership: string | null;
}

interface HarleyOrdersTableProps {
  orders: HarleyOrderMatch[];
  isMatching: boolean;
  onMatchOrder: (order: HarleyOrderMatch) => void;
  formatDateFn: (dateString: string | null) => string;
}

const HarleyOrdersTable: React.FC<HarleyOrdersTableProps> = ({
  orders,
  isMatching,
  onMatchOrder,
  formatDateFn
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        No matching Harley orders found. Try a different search term.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-zinc-800/50">
          <TableHead className="text-zinc-300">Order #</TableHead>
          <TableHead className="text-zinc-300">Part #</TableHead>
          <TableHead className="text-zinc-300">PO #</TableHead>
          <TableHead className="text-zinc-300 text-center">Quantity</TableHead>
          <TableHead className="text-zinc-300">Status</TableHead>
          <TableHead className="text-zinc-300">Order Date</TableHead>
          <TableHead className="text-zinc-300">Expected Arrival</TableHead>
          <TableHead className="text-zinc-300"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order, index) => (
          <TableRow key={`${order.hd_order_number}-${index}`} className="hover:bg-zinc-800/30 border-zinc-800/30">
            <TableCell className="text-zinc-300">{order.hd_order_number}</TableCell>
            <TableCell className="text-zinc-300">{order.part_number}</TableCell>
            <TableCell className="text-zinc-300">{order.dealer_po_number || "N/A"}</TableCell>
            <TableCell className="text-zinc-300 text-center">
              {order.order_quantity || "N/A"}
              {order.matched_quantity && order.matched_quantity > 0 ? (
                <span className="text-amber-400 ml-1 font-medium">
                  ({order.matched_quantity} matched)
                </span>
              ) : null}
            </TableCell>
            <TableCell className="text-zinc-300">{order.status || "N/A"}</TableCell>
            <TableCell className="text-zinc-300">{formatDateFn(order.order_date)}</TableCell>
            <TableCell className="text-zinc-300">{formatDateFn(order.expected_arrival_dealership)}</TableCell>
            <TableCell>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => onMatchOrder(order)}
                disabled={isMatching}
              >
                {isMatching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  "Match"
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default HarleyOrdersTable;
