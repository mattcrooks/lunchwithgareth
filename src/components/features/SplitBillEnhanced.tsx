// Enhanced SplitBill component with full integration
// Implements REQ-SPL-001, REQ-SPL-002, REQ-CTC-001, REQ-CTC-002, REQ-EVT-001

import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/enhanced-button";
import { contactManager, Contact } from "@/lib/contacts";
import { BillSplitService } from "@/lib/billSplit";
import { FxRate, FxManager } from "@/lib/fx";
import { useAuthStore } from "@/store/auth";
import {
  PaymentFlowSelector,
  ParticipantsList,
  Participant,
} from "./splitbill/index";

interface SplitBillEnhancedProps {
  receiptData: {
    imageBlob: Blob | null;
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

  const { currentUser, storedKeys } = useAuthStore();

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

      {/* Payment Flow Selector */}
      <PaymentFlowSelector
        paymentFlow={paymentFlow}
        onPaymentFlowChange={setPaymentFlow}
      />

      {/* Participants List */}
      <ParticipantsList
        participants={participants}
        splitMode={splitMode}
        totalSats={receiptData.totalSats}
        filteredContacts={filteredContacts}
        contactSearch={contactSearch}
        manualPubkey={manualPubkey}
        showAddContact={showAddContact}
        onSplitModeChange={setSplitMode}
        onContactSearchChange={setContactSearch}
        onManualPubkeyChange={setManualPubkey}
        onShowAddContactChange={setShowAddContact}
        onAddParticipant={addParticipant}
        onAddManualContact={addManualContact}
        onRemoveParticipant={removeParticipant}
        onUpdateParticipantShare={updateParticipantShare}
        isValidSplit={isValidSplit}
      />

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
