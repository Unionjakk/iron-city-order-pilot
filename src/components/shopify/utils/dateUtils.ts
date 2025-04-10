
/**
 * Utility functions for date formatting and calculations
 */

// Format date for display
export const formatDate = (dateString: string) => {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Calculate time passed since a date
export const getTimeSinceLastRun = (dateString: string | null) => {
  if (!dateString) return 'never run';
  
  const lastRunDate = new Date(dateString);
  if (isNaN(lastRunDate.getTime())) return 'invalid date';
  
  const now = new Date();
  const diffMs = now.getTime() - lastRunDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};

// Calculate next run time (15 minutes after last run)
export const getNextRunTime = (lastRunTimeString: string | null) => {
  if (!lastRunTimeString) return 'unknown';
  
  const lastRun = new Date(lastRunTimeString);
  if (isNaN(lastRun.getTime())) return 'unknown';
  
  // Calculate next run (15 minutes after last run)
  const nextRun = new Date(lastRun.getTime() + 15 * 60 * 1000);
  
  // Format the next run time
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(nextRun);
};

// Determine if auto-import might be stalled
export const isAutoImportPotentiallyStalled = (autoImportEnabled: boolean, lastCronRun: string | null) => {
  if (!autoImportEnabled || !lastCronRun) return false;
  
  const lastRunDate = new Date(lastCronRun);
  if (isNaN(lastRunDate.getTime())) return false;
  
  const now = new Date();
  const diffMs = now.getTime() - lastRunDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  // If more than 30 minutes have passed since the last cron run, it might be stalled
  return diffMins > 30;
};
