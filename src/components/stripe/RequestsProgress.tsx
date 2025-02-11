import { Progress } from '../ui/progress';

interface RequestsProgressProps {
  remainingRequests: number;
  maxRequests?: number;
  className?: string;
}

export function RequestsProgress({ 
  remainingRequests, 
  maxRequests = 5,
  className 
}: RequestsProgressProps) {
  const progressPercentage = (remainingRequests / maxRequests) * 100;

  return (
    <div className={className}>
      <div className="text-sm mb-2 flex justify-between">
        <span>Remaining Requests</span>
        <span className="font-medium">{remainingRequests}/{maxRequests}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      {remainingRequests === 0 && (
        <p className="text-xs text-destructive mt-1">
          Subscribe to get unlimited requests
        </p>
      )}
    </div>
  );
} 