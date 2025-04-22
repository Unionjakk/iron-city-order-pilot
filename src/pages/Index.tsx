
import React from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdminSection from "@/components/dashboard/sections/AdminSection";

const Index = () => {
  return (
    <div className="space-y-8">
      <DashboardHeader />
      <AdminSection />
    </div>
  );
};

export default Index;
