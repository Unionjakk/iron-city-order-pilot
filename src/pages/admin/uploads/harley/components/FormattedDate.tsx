
import { format } from 'date-fns';

interface FormattedDateProps {
  date: string | null;
  formatString?: string;
}

export const FormattedDate = ({ date, formatString = 'MMM d, yyyy' }: FormattedDateProps) => {
  if (!date) return null;
  
  try {
    return <>{format(new Date(date), formatString)}</>;
  } catch (error) {
    console.error('Error formatting date:', error);
    return <>{date}</>;
  }
};
