
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Check, X, Plus } from 'lucide-react';
import { ExcludeReason } from '../LineItemsExclude';

interface ExcludeOrderFormProps {
  onAddExclusion: (orderNumber: string, reason: ExcludeReason) => void;
}

const formSchema = z.object({
  orderNumber: z.string().min(1, { message: "Order number is required" }),
  reason: z.enum(['Check In', 'Not Shopify'], { 
    required_error: "Please select a reason for exclusion" 
  })
});

type FormValues = z.infer<typeof formSchema>;

const ExcludeOrderForm = ({ onAddExclusion }: ExcludeOrderFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
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
            <FormItem>
              <FormLabel className="text-zinc-300">HD Order Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter order number" 
                  className="bg-zinc-800 border-zinc-700 text-zinc-200" 
                  {...field} 
                />
              </FormControl>
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
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Check In" id="check-in" />
                    <Label htmlFor="check-in" className="flex items-center text-zinc-300">
                      <Check className="mr-1.5 h-4 w-4 text-green-500" />
                      Check In
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Not Shopify" id="not-shopify" />
                    <Label htmlFor="not-shopify" className="flex items-center text-zinc-300">
                      <X className="mr-1.5 h-4 w-4 text-red-500" />
                      Not Shopify
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-orange-500 hover:bg-orange-600" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span> Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <Plus className="mr-1.5 h-4 w-4" /> Add Exclusion
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ExcludeOrderForm;
