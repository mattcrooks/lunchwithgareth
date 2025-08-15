// Enhanced SplitBill component with full integration
// Implements REQ-SPL-001, REQ-SPL-002, REQ-CTC-001, REQ-CTC-002, REQ-EVT-001

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Minus,
  Zap,
  QrCodeIcon,
  UserPlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { contactManager, Contact } from "@/lib/contacts";
import { BillSplitService } from "@/lib/billSplit";
import { FxRate, FxManager } from "@/lib/fx";
import { useAuthStore } from "@/store/auth";

interface Participant {
  id: string;
  contact: Contact;
  shareSats: number;
  sharePercent: number;
}

interface SplitBillEnhancedProps {
  receiptData: {
    imageBlob: Blob;
    totalFiat: number;
    currency: string;
    mealType: "Breakfast" | "Lunch" | "Dinner" | "Other";
    datetime: Date;
    fxRate: FxRate;
    totalSats: number;
    rhash: string;
  };
  onComplete: (result: {
    success: boolean;
    receiptId?: string;
    eventId?: string;
    error?: string;
  }) => void;
  onBack: () => void;
}

export const SplitBillEnhanced: React.FC<SplitBillEnhancedProps> = ({
  receiptData,
  onComplete,
  onBack,
}) => {
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [paymentFlow, setPaymentFlow] = useState<
    "split" | "i-pay-all" | "they-pay-all"
  >("split");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [manualPubkey, setManualPubkey] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  const { currentUser, storedKeys, getDecryptedPrivateKey } = useAuthStore();

  // Load contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      const contacts = contactManager.getAllContacts();
      setAvailableContacts(contacts);
    };
    loadContacts();
  }, []);

  // Update participants when split mode changes
  useEffect(() => {
    if (splitMode === "equal" && participants.length > 0) {
      recalculateEqualSplit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitMode, participants.length]);

  const recalculateEqualSplit = () => {
    if (participants.length === 0) return;

    const shares = BillSplitService.calculateEqualSplit(
      receiptData.totalSats,
      participants.length
    );
    const newParticipants = participants.map((p, index) => ({
      ...p,
      shareSats: shares[index],
      sharePercent: (shares[index] / receiptData.totalSats) * 100,
    }));

    setParticipants(newParticipants);
  };

  const addParticipant = (contact: Contact) => {
    // Check if already added
    if (participants.some((p) => p.contact.pubkey === contact.pubkey)) {
      return;
    }

    const newParticipant: Participant = {
      id: contact.pubkey,
      contact,
      shareSats: 0,
      sharePercent: 0,
    };

    const newParticipants = [...participants, newParticipant];
    setParticipants(newParticipants);

    // Recalculate if equal split
    if (splitMode === "equal") {
      const shares = BillSplitService.calculateEqualSplit(
        receiptData.totalSats,
        newParticipants.length
      );
      const updatedParticipants = newParticipants.map((p, index) => ({
        ...p,
        shareSats: shares[index],
        sharePercent: (shares[index] / receiptData.totalSats) * 100,
      }));
      setParticipants(updatedParticipants);
    }
  };

  const removeParticipant = (id: string) => {
    const newParticipants = participants.filter((p) => p.id !== id);
    setParticipants(newParticipants);

    if (splitMode === "equal" && newParticipants.length > 0) {
      const shares = BillSplitService.calculateEqualSplit(
        receiptData.totalSats,
        newParticipants.length
      );
      const updatedParticipants = newParticipants.map((p, index) => ({
        ...p,
        shareSats: shares[index],
        sharePercent: (shares[index] / receiptData.totalSats) * 100,
      }));
      setParticipants(updatedParticipants);
    }
  };

  const updateParticipantShare = (id: string, sharePercent: number) => {
    const shareSats = Math.floor((receiptData.totalSats * sharePercent) / 100);
    setParticipants(
      participants.map((p) =>
        p.id === id ? { ...p, sharePercent, shareSats } : p
      )
    );
  };

  const addManualContact = async () => {
    if (!manualPubkey.trim()) return;

    try {
      const contact = await contactManager.addContactByPubkey(manualPubkey);
      if (contact) {
        addParticipant(contact);
        setManualPubkey("");
        setShowAddContact(false);
      }
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const filteredContacts = availableContacts.filter(
    (contact) =>
      contactSearch === "" ||
      contactManager
        .getDisplayName(contact.pubkey)
        .toLowerCase()
        .includes(contactSearch.toLowerCase()) ||
      contact.pubkey.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const isValidSplit = () => {
    if (participants.length === 0) return false;

    const totalAllocated = participants.reduce(
      (sum, p) => sum + p.shareSats,
      0
    );
    return (
      BillSplitService.validateSplit(
        receiptData.totalSats,
        participants.map((p) => p.shareSats)
      ) && totalAllocated > 0
    );
  };

  const handleCreateRequest = async () => {
    if (!isValidSplit() || !currentUser || !storedKeys.length) {
      return;
    }

    setIsPublishing(true);

    try {
      // Get device password for signing
      const devicePassword = prompt(
        "Enter your device password to sign the request:"
      );
      if (!devicePassword) {
        setIsPublishing(false);
        return;
      }

      const currentKey = storedKeys.find(
        (k) => k.pubkey === currentUser.pubkey
      );
      if (!currentKey) {
        throw new Error("No stored key found for current user");
      }

      // Prepare request data
      const billSplitRequest = {
        imageBlob: receiptData.imageBlob,
        totalFiat: receiptData.totalFiat,
        currency: receiptData.currency,
        mealType: receiptData.mealType,
        participants: participants.map((p) => ({
          pubkey: p.contact.pubkey,
          shareSats: p.shareSats,
        })),
        flow: paymentFlow,
        datetime: receiptData.datetime,
      };

      // Create the bill split request
      const result = await BillSplitService.prototype.createBillSplitRequest(
        billSplitRequest,
        devicePassword,
        currentKey
      );

      onComplete({
        success: result.success,
        receiptId: result.receiptId,
        eventId: result.eventId,
        error: result.error,
      });
    } catch (error) {
      console.error("Failed to create bill split request:", error);
      onComplete({
        success: false,
        error: (error as Error).message,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Split the Bill
        </h1>
        <div className="text-muted-foreground">
          <p>
            {FxManager.getCurrencySymbol(receiptData.currency)}
            {receiptData.totalFiat.toFixed(2)} →{" "}
            {receiptData.totalSats.toLocaleString()} sats
          </p>
          <p className="text-xs">
            Rate: 1 {receiptData.currency} ={" "}
            {receiptData.fxRate.rate.toLocaleString()} sats
          </p>
        </div>
      </div>

      {/* Payment Flow */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Payment Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: "split", label: "Everyone pays their share", icon: Users },
              { id: "i-pay-all", label: "I pay everything", icon: Zap },
              {
                id: "they-pay-all",
                label: "Others pay everything",
                icon: Users,
              },
            ].map((flow) => {
              const Icon = flow.icon;
              return (
                <Button
                  key={flow.id}
                  variant={paymentFlow === flow.id ? "gradient" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => setPaymentFlow(flow.id as typeof paymentFlow)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="text-sm">{flow.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Participants ({participants.length})</span>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
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
                  <div>
                    <Label htmlFor="search">Search Contacts</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name or pubkey..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Contact list */}
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {filteredContacts.map((contact) => (
                        <Button
                          key={contact.pubkey}
                          variant="ghost"
                          className="w-full justify-start h-auto p-3"
                          onClick={() => {
                            addParticipant(contact);
                            setShowAddContact(false);
                          }}
                          disabled={participants.some(
                            (p) => p.contact.pubkey === contact.pubkey
                          )}
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
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Manual entry */}
                  <div className="border-t pt-4">
                    <Label htmlFor="manual-pubkey">
                      Or Enter Pubkey Manually
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="manual-pubkey"
                        placeholder="Hex pubkey or scan QR..."
                        value={manualPubkey}
                        onChange={(e) => setManualPubkey(e.target.value)}
                      />
                      <Button
                        onClick={addManualContact}
                        disabled={!manualPubkey.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                  onClick={() => setSplitMode("equal")}
                  className="flex-1"
                >
                  Equal Split
                </Button>
                <Button
                  variant={splitMode === "custom" ? "gradient" : "outline"}
                  onClick={() => setSplitMode("custom")}
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
                            updateParticipantShare(
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
                      onClick={() => removeParticipant(participant.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Split Summary */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Allocated:</span>
                  <span className="font-medium">
                    {participants
                      .reduce((sum, p) => sum + p.shareSats, 0)
                      .toLocaleString()}{" "}
                    / {receiptData.totalSats.toLocaleString()} sats
                  </span>
                </div>
                {!isValidSplit() && participants.length > 0 && (
                  <Alert className="mt-2">
                    <AlertDescription className="text-xs">
                      Total allocation exceeds available amount or is zero
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isPublishing}
        >
          Back
        </Button>
        <Button
          variant="gradient"
          size="lg"
          className="flex-2"
          disabled={!isValidSplit() || isPublishing}
          onClick={handleCreateRequest}
        >
          {isPublishing ? (
            "Publishing..."
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Create Payment Request
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
