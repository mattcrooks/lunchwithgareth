import { Button } from "@/components/ui/enhanced-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus } from "lucide-react";
import { Contact } from "@/lib/contacts";
import { ContactSearchInput } from "./ContactSearchInput";
import { ContactListItem } from "./ContactListItem";
import { ManualPubkeyEntry } from "./ManualPubkeyEntry";

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactSearch: string;
  onContactSearchChange: (search: string) => void;
  filteredContacts: Contact[];
  onContactSelect: (contact: Contact) => void;
  manualPubkey: string;
  onManualPubkeyChange: (pubkey: string) => void;
  onManualAdd: () => void;
  existingParticipants: string[]; // Array of existing participant pubkeys
}

export const AddParticipantDialog = ({
  open,
  onOpenChange,
  contactSearch,
  onContactSearchChange,
  filteredContacts,
  onContactSelect,
  manualPubkey,
  onManualPubkeyChange,
  onManualAdd,
  existingParticipants,
}: AddParticipantDialogProps) => {
  const handleContactSelect = (contact: Contact) => {
    onContactSelect(contact);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Person
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search contacts */}
          <ContactSearchInput
            value={contactSearch}
            onChange={onContactSearchChange}
          />

          {/* Contact list */}
          <ScrollArea className="h-40">
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <ContactListItem
                  key={contact.pubkey}
                  contact={contact}
                  onSelect={handleContactSelect}
                  disabled={existingParticipants.includes(contact.pubkey)}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Manual entry */}
          <ManualPubkeyEntry
            value={manualPubkey}
            onChange={onManualPubkeyChange}
            onAdd={onManualAdd}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
