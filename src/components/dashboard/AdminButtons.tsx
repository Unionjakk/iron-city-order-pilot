
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Users, Settings } from "lucide-react";

const AdminButtons = () => {
  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/admin">
        <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
          <Upload className="h-4 w-4 mr-2" />
          Uploads
        </Button>
      </Link>
      <Link to="/users">
        <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
          <Users className="h-4 w-4 mr-2" />
          Users
        </Button>
      </Link>
      <Link to="/admin/settings">
        <Button variant="outline" className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </Link>
    </div>
  );
};

export default AdminButtons;
