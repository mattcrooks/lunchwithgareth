import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { useContactStore } from './store';
import { isValidPubkey, isValidNpub } from '../../lib/ids';
import { nip19 } from 'nostr-tools';

interface ContactSelectorProps {
  participantCount: number;
  onContactsSelected: (pubkeys: string[]) => void;
}

export function ContactSelector({ participantCount, onContactsSelected }: ContactSelectorProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>(new Array(participantCount).fill(''));
  const [manualInputs, setManualInputs] = useState<string[]>(new Array(participantCount).fill(''));
  const [errors, setErrors] = useState<string[]>(new Array(participantCount).fill(''));
  
  const { contacts, loadContacts } = useContactStore();

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    // Adjust arrays when participant count changes
    const newSelected = new Array(participantCount).fill('');
    const newInputs = new Array(participantCount).fill('');
    const newErrors = new Array(participantCount).fill('');
    
    for (let i = 0; i < Math.min(participantCount, selectedContacts.length); i++) {
      newSelected[i] = selectedContacts[i];
      newInputs[i] = manualInputs[i];
      newErrors[i] = errors[i];
    }
    
    setSelectedContacts(newSelected);
    setManualInputs(newInputs);
    setErrors(newErrors);
  }, [participantCount]);

  const validatePubkey = (input: string): { valid: boolean; pubkey?: string; error?: string } => {
    if (!input.trim()) {
      return { valid: false, error: 'Required' };
    }

    // Check if it's a valid hex pubkey
    if (isValidPubkey(input)) {
      return { valid: true, pubkey: input };
    }

    // Check if it's a valid npub
    if (isValidNpub(input)) {
      try {
        const { data } = nip19.decode(input);
        return { valid: true, pubkey: data as string };
      } catch {
        return { valid: false, error: 'Invalid npub format' };
      }
    }

    return { valid: false, error: 'Invalid pubkey format' };
  };

  const handleManualInput = (index: number, value: string) => {
    const newInputs = [...manualInputs];
    const newErrors = [...errors];
    const newSelected = [...selectedContacts];
    
    newInputs[index] = value;
    
    if (value.trim()) {
      const validation = validatePubkey(value);
      if (validation.valid && validation.pubkey) {
        newSelected[index] = validation.pubkey;
        newErrors[index] = '';
      } else {
        newSelected[index] = '';
        newErrors[index] = validation.error || 'Invalid';
      }
    } else {
      newSelected[index] = '';
      newErrors[index] = '';
    }
    
    setManualInputs(newInputs);
    setErrors(newErrors);
    setSelectedContacts(newSelected);
  };

  const selectContact = (index: number, pubkey: string) => {
    const newSelected = [...selectedContacts];
    const newInputs = [...manualInputs];
    const newErrors = [...errors];
    
    newSelected[index] = pubkey;
    newInputs[index] = '';
    newErrors[index] = '';
    
    setSelectedContacts(newSelected);
    setManualInputs(newInputs);
    setErrors(newErrors);
  };

  const handleContinue = () => {
    const filledContacts = selectedContacts.filter(c => c.trim() !== '');
    if (filledContacts.length < participantCount) {
      alert('Please select or enter all participant contacts');
      return;
    }
    onContactsSelected(selectedContacts);
  };

  const getContactName = (pubkey: string) => {
    const contact = contacts.find(c => c.pubkey === pubkey);
    return contact?.name || contact?.nip05 || `${pubkey.slice(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Select Participants</h3>
        
        {contacts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Your Contacts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {contacts.map((contact) => (
                <Button
                  key={contact.pubkey}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextEmptyIndex = selectedContacts.findIndex(c => !c);
                    if (nextEmptyIndex !== -1) {
                      selectContact(nextEmptyIndex, contact.pubkey);
                    }
                  }}
                  className="justify-start text-left"
                  disabled={selectedContacts.includes(contact.pubkey)}
                >
                  {getContactName(contact.pubkey)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {Array.from({ length: participantCount }, (_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Participant {index + 1}
                  </label>
                  
                  {selectedContacts[index] ? (
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                      <span className="text-sm">
                        {getContactName(selectedContacts[index])}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => selectContact(index, '')}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter pubkey (hex) or npub..."
                        value={manualInputs[index]}
                        onChange={(e) => handleManualInput(index, e.target.value)}
                      />
                      {errors[index] && (
                        <div className="text-xs text-destructive">
                          {errors[index]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button 
        onClick={handleContinue} 
        className="w-full"
        disabled={selectedContacts.filter(c => c.trim()).length < participantCount}
      >
        Continue to Confirmation
      </Button>
    </div>
  );
}