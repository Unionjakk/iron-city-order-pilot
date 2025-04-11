
import React from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OrderProgressSection from "@/components/dashboard/sections/OrderProgressSection";
import ToolsSection from "@/components/dashboard/sections/ToolsSection";
import AdminSection from "@/components/dashboard/sections/AdminSection";

const Index = () => {
  return (
    <div className="space-y-8 p-4">
      <DashboardHeader />
      <OrderProgressSection />
      <ToolsSection />
      <AdminSection />
    </div>
  );
};

export default Index;
