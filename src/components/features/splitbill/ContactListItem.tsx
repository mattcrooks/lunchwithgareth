import { Button } from "@/components/ui/enhanced-button";
import { Contact, contactManager } from "@/lib/contacts";

interface ContactListItemProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  disabled?: boolean;
}

export const ContactListItem = ({
  contact,
  onSelect,
  disabled = false,
}: ContactListItemProps) => {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start h-auto p-3"
      onClick={() => onSelect(contact)}
      disabled={disabled}
    >
      <div className="text-left">
        <div className="font-medium">
          {contactManager.getDisplayName(contact.pubkey)}
        </div>
        <div className="text-xs text-muted-foreground">
          {contact.pubkey.slice(0, 16)}...
        </div>
      </div>
    </Button>
  );
};
