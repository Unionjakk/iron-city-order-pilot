
import { useState, useEffect } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ExcludeReason } from '../types/excludeTypes';
import ReasonSelector from './ReasonSelector';
import SubmitButton from './SubmitButton';
import { supabase } from '@/integrations/supabase/client';

interface ExcludeLineItemFormProps {
  onAddExclusion: (orderNumber: string, lineNumber: string, partNumber: string, reason: ExcludeReason) => void;
}

const formSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  lineNumber: z.string().min(1, { message: "Line number is required" }),
  partNumber: z.string().optional(),
  reason: z.enum(['Check In', 'Not Shopify'], { 
    required_error: "Please select a reason for exclusion" 
  })
});

type FormValues = z.infer<typeof formSchema>;

const ExcludeLineItemForm = ({ onAddExclusion }: ExcludeLineItemFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundPartNumber, setFoundPartNumber] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      lineNumber: '',
      partNumber: '',
      reason: 'Check In'
    }
  });

  // Look up part number when order number and line number are both provided
  useEffect(() => {
    const orderNumber = form.watch('orderNumber');
    const lineNumber = form.watch('lineNumber');
    
    const lookupPartNumber = async () => {
      if (orderNumber && lineNumber) {
        setIsLookingUp(true);
        try {
          const { data, error } = await supabase
            .from('hd_order_line_items')
            .select('part_number, description')
            .eq('hd_order_number', orderNumber)
            .eq('line_number', lineNumber)
            .maybeSingle();
          
          if (error) {
            console.error('Error looking up part number:', error);
            return;
          }
          
          if (data && data.part_number) {
            setFoundPartNumber(data.part_number);
            // Only update the form if the user hasn't entered anything yet
            if (!form.getValues('partNumber')) {
              form.setValue('partNumber', data.part_number);
            }
          } else {
            setFoundPartNumber(null);
          }
        } catch (error) {
          console.error('Error during part number lookup:', error);
        } finally {
          setIsLookingUp(false);
        }
      }
    };

    lookupPartNumber();
  }, [form.watch('orderNumber'), form.watch('lineNumber')]);

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // If we have a found part number from the database, use that instead of the form value
      // This ensures we always use the accurate part number from the database when available
      const partNumberToUse = foundPartNumber || values.partNumber || '';
      
      await onAddExclusion(
        values.orderNumber, 
        values.lineNumber, 
        partNumberToUse, 
        values.reason
      );
      form.reset();
      setFoundPartNumber(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-zinc-300">HD Order Number</FormLabel>
              <Input 
                {...field}
                placeholder="Enter HD order number"
                className="bg-zinc-800 text-zinc-100 border-zinc-700 placeholder-zinc-500"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lineNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-zinc-300">Line Number</FormLabel>
              <Input 
                {...field}
                placeholder="Enter line number"
                className="bg-zinc-800 text-zinc-100 border-zinc-700 placeholder-zinc-500"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="partNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-zinc-300">
                Part Number 
                {isLookingUp && 
                  <span className="ml-2 text-xs text-zinc-400">
                    <span className="inline-block h-3 w-3 border-2 border-orange-500 border-r-transparent rounded-full animate-spin mr-1"></span>
                    Looking up...
                  </span>
                }
                {foundPartNumber && 
                  <span className="ml-2 text-xs text-green-500">
                    Found: {foundPartNumber}
                  </span>
                }
              </FormLabel>
              <Input 
                {...field}
                placeholder="Enter part number (optional)"
                className="bg-zinc-800 text-zinc-100 border-zinc-700 placeholder-zinc-500"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-zinc-300">Exclusion Reason</FormLabel>
              <ReasonSelector 
                value={field.value} 
                onChange={(value) => field.onChange(value)} 
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
};

export default ExcludeLineItemForm;
