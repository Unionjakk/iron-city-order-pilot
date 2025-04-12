
import React from "react";
import ToolCard from "../ToolCard";
import { BarChart3, Search, Calculator, Trello } from "lucide-react";

const ToolsSection = () => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4 text-zinc-200">Other Tools</h2>
      <div className="flex flex-col md:flex-row justify-center gap-4">
        <ToolCard
          icon={BarChart3}
          title="Visualiser"
          description="Visualize order progress through the system"
          to="/visualiser"
          className="w-full md:w-1/4 lg:w-1/4"
        />
        <ToolCard
          icon={Search}
          title="Order Lookup"
          description="Search for orders by number, customer email, or name"
          to="/order-lookup"
          disabled={true}
          comingSoon={true}
          className="w-full md:w-1/4 lg:w-1/4"
        />
        <ToolCard
          icon={Calculator}
          title="Accountant Corrections"
          description="Make corrections to Pinnacle for accounting purposes"
          to="/accountant-corrections"
          comingSoon={true}
          className="w-full md:w-1/4 lg:w-1/4"
        />
        <ToolCard
          icon={Trello}
          title="Drag and Drop"
          description="Organize orders in a Trello-style kanban board"
          to="/drag-and-drop"
          className="w-full md:w-1/4 lg:w-1/4"
        />
      </div>
    </section>
  );
};

export default ToolsSection;
