
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonStatsProps {
  title: string;
  className?: string;
}

const ComingSoonStats = ({ title, className = "" }: ComingSoonStatsProps) => {
  return (
    <Card className={`bg-zinc-800 border-zinc-700 ${className}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-zinc-400">Coming soon</p>
      </CardContent>
    </Card>
  );
};

export default ComingSoonStats;
