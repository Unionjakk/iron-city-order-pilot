
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader, Trash2 } from 'lucide-react';

type PinnacleDeleteButtonProps = {
  isDeleting: boolean;
  stockCount: number | null;
  onDelete: () => Promise<void>;
};

const PinnacleDeleteButton = ({ isDeleting, stockCount, onDelete }: PinnacleDeleteButtonProps) => {
  return (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={onDelete}
      disabled={isDeleting || stockCount === 0}
    >
      {isDeleting ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Deleting...
        </>
      ) : (
        <>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete All Stock Data
        </>
      )}
    </Button>
  );
};

export default PinnacleDeleteButton;
