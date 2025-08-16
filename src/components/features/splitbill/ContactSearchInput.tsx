import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface ContactSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const ContactSearchInput = ({
  value,
  onChange,
  placeholder = "Search by name or pubkey...",
}: ContactSearchInputProps) => {
  return (
    <div>
      <Label htmlFor="search">Search Contacts</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};
