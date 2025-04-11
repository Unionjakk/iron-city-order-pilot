
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  className?: string;
}

const ProgressCard = ({ icon: Icon, title, description, to, className = "" }: ProgressCardProps) => {
  return (
    <Link to={to} className={className}>
      <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
        <CardContent className="p-6 flex flex-col items-center text-center">
          <Icon className="h-10 w-10 text-orange-500 mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          <p className="text-zinc-400 text-sm">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProgressCard;
