
import { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ExcludeReason } from '../types/excludeTypes';
import ReasonSelector from './ReasonSelector';
import SubmitButton from './SubmitButton';

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      lineNumber: '',
      partNumber: '',
      reason: 'Check In'
    }
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      await onAddExclusion(
        values.orderNumber, 
        values.lineNumber, 
        values.partNumber || '', 
        values.reason
      );
      form.reset();
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
              <FormLabel className="text-zinc-300">Part Number (Optional)</FormLabel>
              <Input 
                {...field}
                placeholder="Enter part number"
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
