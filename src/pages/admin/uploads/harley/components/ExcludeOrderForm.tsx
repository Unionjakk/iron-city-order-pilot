
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Check, X, Plus } from 'lucide-react';
import { ExcludeReason } from '../LineItemsExclude';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [open, setOpen] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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

  // Fetch order numbers from database
  useEffect(() => {
    const fetchOrderNumbers = async () => {
      if (searchValue.length < 2) {
        setOrderNumbers([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('hd_orders')
          .select('hd_order_number')
          .ilike('hd_order_number', `%${searchValue}%`)
          .limit(10);
        
        if (error) throw error;
        
        if (data && Array.isArray(data)) {
          // Safely map the data to strings
          const numbers = data.map(order => 
            order && typeof order.hd_order_number === 'string' 
              ? order.hd_order_number 
              : ''
          ).filter(Boolean); // Remove any empty strings
          
          setOrderNumbers(numbers);
        } else {
          setOrderNumbers([]);
        }
      } catch (error) {
        console.error('Error fetching order numbers:', error);
        toast.error('Failed to load order suggestions');
        setOrderNumbers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderNumbers();
  }, [searchValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-zinc-300">HD Order Number</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between bg-zinc-800 border-zinc-700 text-zinc-200",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? field.value
                        : "Select an order number"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-zinc-800 border-zinc-700">
                  <Command className="bg-zinc-800">
                    <CommandInput 
                      placeholder="Search order number..." 
                      onValueChange={setSearchValue}
                      className="border-zinc-700 text-zinc-200"
                    />
                    {loading && (
                      <div className="py-6 text-center text-sm text-zinc-400">
                        Loading...
                      </div>
                    )}
                    <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
                      {searchValue.length < 2 
                        ? "Type at least 2 characters to search" 
                        : "No order number found"}
                    </CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                      {orderNumbers.length > 0 && orderNumbers.map((orderNumber) => (
                        <CommandItem
                          key={orderNumber}
                          value={orderNumber}
                          onSelect={() => {
                            form.setValue("orderNumber", orderNumber);
                            setOpen(false);
                          }}
                          className="text-zinc-200 hover:bg-zinc-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              orderNumber === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {orderNumber}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
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
              <Plus className="mr-1.5 h-4 w-4" /> Check In / Exclude
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
};

export default ExcludeOrderForm;
