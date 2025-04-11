
import React from "react";
import ProgressCard from "../ProgressCard";
import ComingSoonStats from "../ComingSoonStats";
import PickStats from "@/components/stats/PickStats";
import { 
  ShoppingBag, 
  CheckCircle, 
  ShoppingCart, 
  Truck, 
  PackageCheck, 
  Package 
} from "lucide-react";

const OrderProgressSection = () => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-zinc-200">Order Progress</h2>
      <div className="space-y-4">
        {/* To Pick */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={ShoppingBag}
            title="To Pick"
            description="Manage orders ready to be picked from inventory"
            to="/actions/picklist"
            className="md:w-1/3"
          />
          <PickStats className="md:w-2/3" />
        </div>

        {/* Picked */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={CheckCircle}
            title="Picked"
            description="View all orders that have been picked"
            to="/actions/picked"
            className="md:w-1/3"
          />
          <ComingSoonStats title="Picked Stats" className="md:w-2/3" />
        </div>

        {/* To Order */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={ShoppingCart}
            title="To Order"
            description="Manage orders that need to be ordered from suppliers"
            to="/actions/toorder"
            className="md:w-1/3"
          />
          <ComingSoonStats title="Order Stats" className="md:w-2/3" />
        </div>

        {/* Ordered */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={PackageCheck}
            title="Ordered"
            description="View all orders that have been placed with suppliers"
            to="/actions/ordered"
            className="md:w-1/3"
          />
          <ComingSoonStats title="Ordered Stats" className="md:w-2/3" />
        </div>

        {/* To Dispatch */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={Truck}
            title="To Dispatch"
            description="Manage orders ready to be dispatched to customers"
            to="/actions/dispatch"
            className="md:w-1/3"
          />
          <ComingSoonStats title="Dispatch Stats" className="md:w-2/3" />
        </div>

        {/* Back Order Report */}
        <div className="flex flex-col md:flex-row gap-4">
          <ProgressCard
            icon={Package}
            title="Back Order Report"
            description="View detailed back order reports"
            to="/actions/backorder-report"
            className="md:w-1/3"
          />
          <ComingSoonStats title="Backorder Stats" className="md:w-2/3" />
        </div>
      </div>
    </section>
  );
};

export default OrderProgressSection;
