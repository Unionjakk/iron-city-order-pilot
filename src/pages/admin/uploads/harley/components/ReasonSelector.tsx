import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Check, X } from 'lucide-react';
import { ExcludeReason } from '../types/excludeTypes';

interface ReasonSelectorProps {
  value: ExcludeReason;
  onChange: (value: ExcludeReason) => void;
}

const ReasonSelector = ({ value, onChange }: ReasonSelectorProps) => {
  return (
    <FormControl>
      <RadioGroup
        onValueChange={onChange}
        value={value}
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
  );
};

export default ReasonSelector;
