
import { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ExcludeReason } from '../types/excludeTypes';
import ReasonSelector from './ReasonSelector';
import SubmitButton from './SubmitButton';
import OrderNumberCombobox from './OrderNumberCombobox';

interface ExcludeOrderFormProps {
  onAddExclusion: (orderNumber: string, reason: ExcludeReason) => void;
  defaultOrderNumber?: string;
}

const formSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  reason: z.enum(['Check In', 'Not Shopify'], { 
    required_error: "Please select a reason for exclusion" 
  })
});

type FormValues = z.infer<typeof formSchema>;

const ExcludeOrderForm = ({ onAddExclusion, defaultOrderNumber = '' }: ExcludeOrderFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: defaultOrderNumber,
      reason: 'Check In'
    }
  });

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      await onAddExclusion(values.orderNumber, values.reason);
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
              <OrderNumberCombobox 
                value={field.value} 
                onChange={field.onChange} 
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

export default ExcludeOrderForm;
