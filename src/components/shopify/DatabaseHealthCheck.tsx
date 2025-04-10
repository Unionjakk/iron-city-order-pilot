
import { useState } from 'react';
import { AlertCircle, RefreshCw, FileWarning, FileCheck, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthCheckState {
  isChecking: boolean;
  unfulfilled_in_archive: number;
  fulfilled_in_active: number;
  duplicate_orders: number;
  mismatched_line_items: number;
  last_check: string | null;
}

const DatabaseHealthCheck = () => {
  const [healthState, setHealthState] = useState<HealthCheckState>({
    isChecking: false,
    unfulfilled_in_archive: 0,
    fulfilled_in_active: 0,
    duplicate_orders: 0,
    mismatched_line_items: 0,
    last_check: null
  });
  const [isRestoringItems, setIsRestoringItems] = useState(false);
  const { toast } = useToast();

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Run a database health check
  const runHealthCheck = async () => {
    setHealthState(prev => ({ ...prev, isChecking: true }));
    
    try {
      // Check for unfulfilled orders in archive
      const { count: unfulfilled_in_archive, error: archiveError } = await supabase
        .from('shopify_archived_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unfulfilled');
        
      if (archiveError) {
        console.error('Error checking archived orders:', archiveError);
        toast({
          title: "Error",
          description: "Failed to check archived orders. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicate orders by running a direct query
      // Fixed: Replace complex query with a simpler approach
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('shopify_archived_orders')
        .select('shopify_order_id');
      
      if (duplicateError) {
        console.error('Error fetching archived order IDs:', duplicateError);
      }
      
      let duplicate_orders = 0;
      
      // If we have archived orders, check which ones exist in active orders
      if (duplicateData && duplicateData.length > 0) {
        const archivedOrderIds = duplicateData.map(order => order.shopify_order_id);
        
        // Now check which of these IDs exist in the active orders table
        const { data: activeMatches, error: activeMatchError } = await supabase
          .from('shopify_orders')
          .select('shopify_order_id')
          .in('shopify_order_id', archivedOrderIds);
          
        if (activeMatchError) {
          console.error('Error checking for duplicates:', activeMatchError);
        } else if (activeMatches) {
          duplicate_orders = activeMatches.length;
        }
      }
      
      // Check for line item mismatches (orders with no line items)
      // Find orders without line items
      const { data: activeOrdersData } = await supabase
        .from('shopify_orders')
        .select('id');
        
      let mismatched_line_items = 0;
      
      if (activeOrdersData && activeOrdersData.length > 0) {
        // For each active order, check if it has line items
        for (const order of activeOrdersData) {
          const { count } = await supabase
            .from('shopify_order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id);
            
          if (count === 0) {
            mismatched_line_items++;
          }
        }
      }
      
      // Check for fulfilled orders in active table
      const { count: fulfilled_in_active, error: fulfilledError } = await supabase
        .from('shopify_orders')
        .select('*', { count: 'exact', head: true })
        .not('status', 'eq', 'unfulfilled');
        
      if (fulfilledError) {
        console.error('Error checking active orders:', fulfilledError);
      }
      
      // Update health state
      setHealthState({
        isChecking: false,
        unfulfilled_in_archive: unfulfilled_in_archive || 0,
        fulfilled_in_active: fulfilled_in_active || 0,
        duplicate_orders,
        mismatched_line_items,
        last_check: new Date().toISOString()
      });
      
      toast({
        title: "Health Check Complete",
        description: "Database health check completed successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error running health check:', error);
      toast({
        title: "Health Check Failed",
        description: "Failed to complete database health check.",
        variant: "destructive",
      });
      setHealthState(prev => ({ ...prev, isChecking: false }));
    }
  };
  
  // Handle restoring unfulfilled orders from archive
  const handleRestoreUnfulfilled = async () => {
    setIsRestoringItems(true);
    
    try {
      // Call the edge function to restore unfulfilled orders from archive
      const { data, error } = await supabase.functions.invoke('shopify-restore-archived', {
        body: { onlyUnfulfilled: true }
      });
      
      if (error) {
        console.error('Error restoring orders:', error);
        throw new Error(error.message || 'Failed to restore archived orders');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to restore archived orders');
      }
      
      // Run health check again to update stats
      await runHealthCheck();
      
      toast({
        title: "Restore Completed",
        description: `Successfully restored ${data.restored} unfulfilled orders from archive.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error restoring orders:', error);
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoringItems(false);
    }
  };

  // Determine overall health status
  const getHealthStatus = () => {
    const hasIssues = 
      healthState.unfulfilled_in_archive > 0 || 
      healthState.duplicate_orders > 0 || 
      healthState.mismatched_line_items > 0;
      
    if (healthState.last_check === null) {
      return { 
        status: "unknown", 
        message: "Database health has not been checked yet"
      };
    }
    
    if (hasIssues) {
      return { 
        status: "issues", 
        message: "Database has potential issues that need attention"
      };
    }
    
    return { 
      status: "healthy", 
      message: "Database appears to be healthy"
    };
  };
  
  const healthStatus = getHealthStatus();

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-orange-500 flex items-center">
            <FileCheck className="mr-2 h-5 w-5" /> Database Health Check
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Identify and fix potential issues with your Shopify order data
          </CardDescription>
        </div>
        
        <Button 
          onClick={runHealthCheck} 
          variant="outline" 
          size="sm"
          disabled={healthState.isChecking}
          className="whitespace-nowrap"
        >
          {healthState.isChecking ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Health Check
            </>
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {healthState.last_check && (
          <Alert 
            variant={healthStatus.status === "issues" ? "destructive" : "default"}
            className={healthStatus.status === "issues" 
              ? "bg-amber-900/20 border-amber-500/50" 
              : "bg-emerald-900/20 border-emerald-500/50"
            }
          >
            {healthStatus.status === "issues" ? (
              <FileWarning className="h-4 w-4 text-amber-500" />
            ) : (
              <FileCheck className="h-4 w-4 text-emerald-500" />
            )}
            <AlertTitle className={healthStatus.status === "issues" ? "text-amber-500" : "text-emerald-500"}>
              {healthStatus.status === "issues" ? "Issues Detected" : "System Healthy"}
            </AlertTitle>
            <AlertDescription className="text-zinc-300">
              {healthStatus.message}
              {healthState.last_check && (
                <div className="text-xs text-zinc-500 mt-1">
                  Last checked: {formatDate(healthState.last_check)}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthState.unfulfilled_in_archive > 0 && (
            <Alert variant="destructive" className="bg-amber-900/20 border-amber-500/50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500 flex items-center justify-between">
                <span>Unfulfilled Orders in Archive</span>
                <span className="text-amber-400">{healthState.unfulfilled_in_archive}</span>
              </AlertTitle>
              <AlertDescription className="text-zinc-300">
                There are unfulfilled orders in the archived table that should be active.
                <div className="mt-2">
                  <Button 
                    onClick={handleRestoreUnfulfilled} 
                    size="sm" 
                    className="bg-amber-500 hover:bg-amber-600"
                    disabled={isRestoringItems}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {isRestoringItems ? "Restoring..." : "Restore Orders"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {healthState.duplicate_orders > 0 && (
            <Alert variant="destructive" className="bg-amber-900/20 border-amber-500/50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500 flex items-center justify-between">
                <span>Duplicate Orders</span>
                <span className="text-amber-400">{healthState.duplicate_orders}</span>
              </AlertTitle>
              <AlertDescription className="text-zinc-300">
                Some orders exist in both active and archived tables. This can cause confusion.
              </AlertDescription>
            </Alert>
          )}
          
          {healthState.mismatched_line_items > 0 && (
            <Alert variant="destructive" className="bg-amber-900/20 border-amber-500/50">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500 flex items-center justify-between">
                <span>Orders Missing Line Items</span>
                <span className="text-amber-400">{healthState.mismatched_line_items}</span>
              </AlertTitle>
              <AlertDescription className="text-zinc-300">
                Some orders have no associated line items, which may indicate data integrity issues.
              </AlertDescription>
            </Alert>
          )}
          
          {healthState.fulfilled_in_active > 0 && (
            <Alert variant="default" className="bg-blue-900/20 border-blue-500/50">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-500 flex items-center justify-between">
                <span>Fulfilled Orders in Active Table</span>
                <span className="text-blue-400">{healthState.fulfilled_in_active}</span>
              </AlertTitle>
              <AlertDescription className="text-zinc-300">
                These orders are marked as fulfilled but haven't been archived yet. This is normal and will be handled during the next import.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {healthState.last_check && 
          healthState.unfulfilled_in_archive === 0 && 
          healthState.duplicate_orders === 0 && 
          healthState.mismatched_line_items === 0 && (
          <Alert className="bg-emerald-900/20 border-emerald-500/50">
            <FileCheck className="h-4 w-4 text-emerald-500" />
            <AlertTitle className="text-emerald-500">No Issues Detected</AlertTitle>
            <AlertDescription className="text-zinc-300">
              Your Shopify order database appears to be in good health. Continue monitoring regularly.
            </AlertDescription>
          </Alert>
        )}
        
        {!healthState.last_check && (
          <div className="text-center py-4 text-zinc-500">
            <FileCheck className="h-12 w-12 mx-auto mb-2 text-zinc-600" />
            <p>Run a health check to see the status of your Shopify order database</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseHealthCheck;
