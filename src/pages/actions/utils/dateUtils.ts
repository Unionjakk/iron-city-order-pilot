
import { format } from "date-fns";

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch (e) {
    return "Invalid date";
  }
};
