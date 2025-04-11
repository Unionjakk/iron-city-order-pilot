
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface SubmitButtonProps {
  isSubmitting: boolean;
}

const SubmitButton = ({ isSubmitting }: SubmitButtonProps) => {
  return (
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
  );
};

export default SubmitButton;
