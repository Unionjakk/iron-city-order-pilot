
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Edit, Trash2, RefreshCw, Check, Plus, AlertCircle, FileText, ActivitySquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

// Define types for our form and data
type SkuCorrection = {
  id: string;
  original_part_no: string;
  corrected_part_no: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
  last_applied_at?: string;
};

type FormValues = {
  original_part_no: string;
  corrected_part_no: string;
  notes?: string;
};

const AdminSettings = () => {
  // State for managing corrections list
  const [corrections, setCorrections] = useState<SkuCorrection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Set up form
  const form = useForm<FormValues>({
    defaultValues: {
      original_part_no: '',
      corrected_part_no: '',
      notes: ''
    }
  });

  // Fetch corrections on component mount
  useEffect(() => {
    fetchCorrections();
  }, []);

  // Function to fetch corrections list
  const fetchCorrections = async () => {
    try {
      setIsLoading(true);
      // Using type assertion to handle the new table
      const { data, error } = await supabase
        .from('pinnacle_sku_corrections' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Assert that the data conforms to our SkuCorrection type
      setCorrections(data as unknown as SkuCorrection[]);
    } catch (error) {
      console.error('Error fetching SKU corrections:', error);
      toast.error('Failed to load SKU corrections');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to add a new correction
  const addCorrection = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Using type assertion to handle the new table
      const { data, error } = await supabase
        .from('pinnacle_sku_corrections' as any)
        .insert([
          {
            original_part_no: values.original_part_no,
            corrected_part_no: values.corrected_part_no,
            notes: values.notes
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast.error('This SKU already has a correction entry');
        } else {
          throw error;
        }
      } else {
        toast.success('SKU correction added successfully');
        form.reset();
        setShowForm(false);
        await fetchCorrections();
      }
    } catch (error) {
      console.error('Error adding SKU correction:', error);
      toast.error('Failed to add SKU correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to update an existing correction
  const updateCorrection = async (values: FormValues) => {
    if (!editingId) return;

    try {
      setIsSubmitting(true);

      // Using type assertion to handle the new table
      const { error } = await supabase
        .from('pinnacle_sku_corrections' as any)
        .update({
          original_part_no: values.original_part_no,
          corrected_part_no: values.corrected_part_no,
          notes: values.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) {
        if (error.code === '23505') {
          toast.error('This SKU already has a correction entry');
        } else {
          throw error;
        }
      } else {
        toast.success('SKU correction updated successfully');
        form.reset();
        setEditingId(null);
        setShowForm(false);
        await fetchCorrections();
      }
    } catch (error) {
      console.error('Error updating SKU correction:', error);
      toast.error('Failed to update SKU correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete a correction
  const deleteCorrection = async (id: string) => {
    try {
      // Using type assertion to handle the new table
      const { error } = await supabase
        .from('pinnacle_sku_corrections' as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('SKU correction deleted successfully');
      await fetchCorrections();
    } catch (error) {
      console.error('Error deleting SKU correction:', error);
      toast.error('Failed to delete SKU correction');
    }
  };

  // Function to apply all corrections
  const applyCorrections = async () => {
    try {
      setIsApplying(true);
      // Using type assertion for the function call
      const { data, error } = await supabase
        .rpc('apply_sku_corrections' as any);

      if (error) {
        throw error;
      }

      // Type assertion for the response data structure
      const result = data as { success: boolean; message: string; corrections_applied: number };
      
      if (result.success) {
        toast.success(`${result.corrections_applied} SKU corrections applied successfully`);
        await fetchCorrections(); // Refresh to get updated last_applied_at timestamps
      } else {
        toast.error('Failed to apply corrections');
      }
    } catch (error) {
      console.error('Error applying SKU corrections:', error);
      toast.error('Failed to apply SKU corrections');
    } finally {
      setIsApplying(false);
    }
  };

  // Start editing a correction
  const startEditing = (correction: SkuCorrection) => {
    form.reset({
      original_part_no: correction.original_part_no,
      corrected_part_no: correction.corrected_part_no,
      notes: correction.notes || ''
    });
    setEditingId(correction.id);
    setShowForm(true);
  };

  // Cancel form
  const cancelForm = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    if (editingId) {
      updateCorrection(values);
    } else {
      addCorrection(values);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-orange-400" />
        <h1 className="text-2xl font-bold text-orange-500">Admin Settings</h1>
      </div>
      <p className="text-orange-400/80">Configure system preferences and application settings</p>
      
      {/* Admin Tools */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Admin Tools</CardTitle>
          <CardDescription className="text-zinc-400">
            Special administrative tools and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/settings/adminflowchart">
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400"
              >
                <div className="flex flex-col items-center gap-2 py-2">
                  <ActivitySquare className="h-10 w-10" />
                  <span className="text-base font-medium">Action Flow Chart</span>
                  <span className="text-xs text-zinc-400">View order processing workflow</span>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* SKU Corrections Card */}
      <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-orange-500">Pinnacle SKU Corrections</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage part number corrections for the Pinnacle inventory system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!showForm && (
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Correction
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  disabled={corrections.length === 0 || isApplying}
                >
                  <RefreshCw className={`mr-1 h-4 w-4 ${isApplying ? 'animate-spin' : ''}`} /> 
                  Apply All Corrections
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-orange-500">Apply SKU Corrections</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    This will update all matching product SKUs in the Pinnacle stock database. 
                    This action cannot be undone. Are you sure you want to continue?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      applyCorrections();
                    }}
                  >
                    Apply Corrections
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="border-zinc-700 bg-zinc-800/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{editingId ? 'Edit' : 'Add'} SKU Correction</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="original_part_no"
                        rules={{ required: 'Original SKU is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter original SKU..." {...field} />
                            </FormControl>
                            <FormDescription className="text-xs text-zinc-500">
                              The incorrect SKU as it appears in Pinnacle
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="corrected_part_no"
                        rules={{ required: 'Corrected SKU is required' }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Corrected SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter corrected SKU..." {...field} />
                            </FormControl>
                            <FormDescription className="text-xs text-zinc-500">
                              The correct SKU that should be used
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Optional notes about this correction..." 
                              className="h-20" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={cancelForm}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            {editingId ? 'Update' : 'Save'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Corrections Table */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="animate-spin h-8 w-8 text-orange-500" />
            </div>
          ) : corrections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-12 w-12 text-zinc-600 mb-3" />
              <h3 className="text-lg font-medium text-zinc-400">No SKU corrections yet</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-md">
                Add a correction to automatically update the SKU when applying corrections
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-800/40">
                  <TableRow>
                    <TableHead className="text-zinc-400 w-1/4">Original SKU</TableHead>
                    <TableHead className="text-zinc-400 w-1/4">Corrected SKU</TableHead>
                    <TableHead className="text-zinc-400 w-1/4">Last Applied</TableHead>
                    <TableHead className="text-zinc-400 w-1/4">Notes</TableHead>
                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corrections.map((correction) => (
                    <TableRow key={correction.id} className="border-zinc-800">
                      <TableCell className="font-mono text-zinc-300">{correction.original_part_no}</TableCell>
                      <TableCell className="font-mono text-orange-400">{correction.corrected_part_no}</TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {formatDate(correction.last_applied_at)}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm max-w-xs truncate">
                        {correction.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(correction)}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10"
                          >
                            <span className="sr-only">Edit</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                              >
                                <span className="sr-only">Delete</span>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-zinc-900 border-zinc-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-400">Delete SKU Correction</AlertDialogTitle>
                                <AlertDialogDescription className="text-zinc-400">
                                  Are you sure you want to delete this SKU correction?
                                  <div className="mt-2 p-2 bg-zinc-800 rounded border border-zinc-700">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="text-zinc-500">Original SKU:</div>
                                      <div className="text-zinc-300 font-mono">{correction.original_part_no}</div>
                                      <div className="text-zinc-500">Corrected SKU:</div>
                                      <div className="text-orange-400 font-mono">{correction.corrected_part_no}</div>
                                    </div>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-500 hover:bg-red-600 text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteCorrection(correction.id);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
