
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, children, className = "" }: StatCardProps) => {
  return (
    <Card className={`bg-zinc-800 border-zinc-700 ${className}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
};

export default StatCard;
