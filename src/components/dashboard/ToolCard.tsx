
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  disabled?: boolean;
  comingSoon?: boolean;
  className?: string;
}

const ToolCard = ({ 
  icon: Icon, 
  title, 
  description, 
  to, 
  disabled = false, 
  comingSoon = false,
  className = "" 
}: ToolCardProps) => {
  const cardContent = (
    <CardContent className="p-6 flex flex-col items-center text-center">
      <Icon className={`h-10 w-10 ${disabled ? 'text-orange-500/60' : 'text-orange-500'} mb-3`} />
      <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm">{description}</p>
      {comingSoon && (
        <span className="mt-2 text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">Coming Soon</span>
      )}
    </CardContent>
  );

  if (disabled) {
    return (
      <div className={`${className}`}>
        <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700/50 transition-colors cursor-not-allowed h-full">
          {cardContent}
        </Card>
      </div>
    );
  }

  return (
    <Link to={to} className={`${className}`}>
      <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 transition-colors cursor-pointer h-full">
        {cardContent}
      </Card>
    </Link>
  );
};

export default ToolCard;
