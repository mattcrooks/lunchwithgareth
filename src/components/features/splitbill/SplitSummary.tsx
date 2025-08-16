import { Alert, AlertDescription } from "@/components/ui/alert";

interface SplitSummaryProps {
  totalAllocated: number;
  totalAvailable: number;
  isValid: boolean;
  participantCount: number;
}

export const SplitSummary = ({
  totalAllocated,
  totalAvailable,
  isValid,
  participantCount,
}: SplitSummaryProps) => {
  return (
    <div className="bg-muted/50 p-3 rounded-lg">
      <div className="flex justify-between items-center text-sm">
        <span>Total Allocated:</span>
        <span className="font-medium">
          {totalAllocated.toLocaleString()} / {totalAvailable.toLocaleString()}{" "}
          sats
        </span>
      </div>
      {!isValid && participantCount > 0 && (
        <Alert className="mt-2">
          <AlertDescription className="text-xs">
            Total allocation exceeds available amount or is zero
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
