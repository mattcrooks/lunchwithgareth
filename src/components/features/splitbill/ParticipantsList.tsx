import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Minus } from "lucide-react";
import { Contact, contactManager } from "@/lib/contacts";
import { AddParticipantDialog } from "./AddParticipantDialog";
import { SplitSummary } from "./SplitSummary";

export interface Participant {
  id: string;
  contact: Contact;
  shareSats: number;
  sharePercent: number;
}

type SplitMode = "equal" | "custom";

interface ParticipantsListProps {
  participants: Participant[];
  splitMode: SplitMode;
  totalSats: number;
  filteredContacts: Contact[];
  contactSearch: string;
  manualPubkey: string;
  showAddContact: boolean;
  onSplitModeChange: (mode: SplitMode) => void;
  onContactSearchChange: (search: string) => void;
  onManualPubkeyChange: (pubkey: string) => void;
  onShowAddContactChange: (show: boolean) => void;
  onAddParticipant: (contact: Contact) => void;
  onAddManualContact: () => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateParticipantShare: (id: string, percent: number) => void;
  isValidSplit: () => boolean;
}

export const ParticipantsList = ({
  participants,
  splitMode,
  totalSats,
  filteredContacts,
  contactSearch,
  manualPubkey,
  showAddContact,
  onSplitModeChange,
  onContactSearchChange,
  onManualPubkeyChange,
  onShowAddContactChange,
  onAddParticipant,
  onAddManualContact,
  onRemoveParticipant,
  onUpdateParticipantShare,
  isValidSplit,
}: ParticipantsListProps) => {
  const totalAllocated = participants.reduce((sum, p) => sum + p.shareSats, 0);
  const existingParticipants = participants.map((p) => p.contact.pubkey);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Participants ({participants.length})</span>
          <AddParticipantDialog
            open={showAddContact}
            onOpenChange={onShowAddContactChange}
            contactSearch={contactSearch}
            onContactSearchChange={onContactSearchChange}
            filteredContacts={filteredContacts}
            onContactSelect={onAddParticipant}
            manualPubkey={manualPubkey}
            onManualPubkeyChange={onManualPubkeyChange}
            onManualAdd={onAddManualContact}
            existingParticipants={existingParticipants}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No participants added yet</p>
            <p className="text-sm">Add people to split the bill with</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Split Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={splitMode === "equal" ? "gradient" : "outline"}
                onClick={() => onSplitModeChange("equal")}
                className="flex-1"
              >
                Equal Split
              </Button>
              <Button
                variant={splitMode === "custom" ? "gradient" : "outline"}
                onClick={() => onSplitModeChange("custom")}
                className="flex-1"
              >
                Custom Split
              </Button>
            </div>

            {/* Participants List */}
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 bg-card-subtle rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {contactManager.getDisplayName(
                        participant.contact.pubkey
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {participant.contact.pubkey.slice(0, 16)}...
                    </div>
                  </div>

                  {splitMode === "equal" ? (
                    <Badge variant="secondary">
                      {participant.shareSats.toLocaleString()} sats
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={participant.sharePercent.toFixed(1)}
                        onChange={(e) =>
                          onUpdateParticipantShare(
                            participant.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 text-center"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                      <Badge variant="secondary">
                        {participant.shareSats.toLocaleString()} sats
                      </Badge>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveParticipant(participant.id)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Split Summary */}
            <SplitSummary
              totalAllocated={totalAllocated}
              totalAvailable={totalSats}
              isValid={isValidSplit()}
              participantCount={participants.length}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
