import { Button } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualPubkeyEntryProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ManualPubkeyEntry = ({
  value,
  onChange,
  onAdd,
  disabled = false,
  placeholder = "Hex pubkey or scan QR...",
}: ManualPubkeyEntryProps) => {
  return (
    <div className="border-t pt-4">
      <Label htmlFor="manual-pubkey">Or Enter Pubkey Manually</Label>
      <div className="flex gap-2 mt-2">
        <Input
          id="manual-pubkey"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button onClick={onAdd} disabled={disabled || !value.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
};
