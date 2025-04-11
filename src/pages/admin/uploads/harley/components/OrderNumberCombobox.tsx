
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderNumberComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

const OrderNumberCombobox = ({ value, onChange }: OrderNumberComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-zinc-800 border-zinc-700 text-zinc-200",
              !value && "text-muted-foreground"
            )}
          >
            {value
              ? value
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
                  onChange(orderNumber);
                  setOpen(false);
                }}
                className="text-zinc-200 hover:bg-zinc-700"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    orderNumber === value
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
  );
};

export default OrderNumberCombobox;
