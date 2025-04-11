
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PicklistTable from "./components/PicklistTable";
import PicklistFilter from "./components/PicklistFilter";
import PicklistLoading from "./components/PicklistLoading";
import { usePicklistData } from "./hooks/usePicklistData";

const PicklistPage = () => {
  const { orders, isLoading, error, refreshData } = usePicklistData();
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading picklist data",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-orange-500">To Pick</h1>
        <p className="text-orange-400/80">Manage your picking list</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Picklist Dashboard</CardTitle>
          <CardDescription>
            Report filtered to show Leeds Iron City Motorcycles (ID 53277786267) fresh unfulfilled orders that have not had any progression
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <PicklistLoading />
          ) : (
            <>
              <PicklistFilter />
              <PicklistTable 
                orders={orders}
                refreshData={refreshData}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PicklistPage;
