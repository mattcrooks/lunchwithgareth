import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { useReceiptStore } from '../receipt/store';
import { formatSats, formatCurrency } from '../../lib/fx';
import { getOverallStatus } from '../../lib/rounding';
import type { Receipt } from '../../types/models';

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  
  const { receipts, loading, error, loadReceipts, searchReceipts } = useReceiptStore();

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleSearch = async () => {
    if (searchQuery || statusFilter) {
      await searchReceipts(searchQuery, statusFilter);
    } else {
      await loadReceipts();
    }
  };

  const getStatusBadge = (receipt: Receipt) => {
    const status = getOverallStatus(receipt.participants);
    const colors = {
      open: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      settled: 'bg-green-100 text-green-800',
      overpaid: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (selectedReceipt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
            ← Back to History
          </Button>
          <h2 className="text-xl font-bold">Receipt Details</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedReceipt.mealType} - {new Date(selectedReceipt.createdAt).toLocaleDateString()}</span>
              {getStatusBadge(selectedReceipt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedReceipt.imageUri && (
              <div>
                <h4 className="font-medium mb-2">Receipt Image</h4>
                <img
                  src={selectedReceipt.imageUri}
                  alt="Receipt"
                  className="max-w-full max-h-64 rounded border"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Amount:</span>{' '}
                {formatCurrency(selectedReceipt.amountFiat, selectedReceipt.currency)}
              </div>
              <div>
                <span className="font-medium">Sats:</span>{' '}
                {formatSats(selectedReceipt.amountSats)}
              </div>
              <div>
                <span className="font-medium">FX Rate:</span>{' '}
                {selectedReceipt.fxRate} sats/{selectedReceipt.currency}
              </div>
              <div>
                <span className="font-medium">Source:</span>{' '}
                {selectedReceipt.fxSource}
              </div>
              <div>
                <span className="font-medium">Flow:</span>{' '}
                {selectedReceipt.flow}
              </div>
              <div>
                <span className="font-medium">Participants:</span>{' '}
                {selectedReceipt.participants.length}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Participants</h4>
              <div className="space-y-2">
                {selectedReceipt.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="text-sm">
                      <div className="font-medium">
                        {participant.pubkey.slice(0, 8)}...{participant.pubkey.slice(-8)}
                      </div>
                      <div className="text-muted-foreground">
                        Owes: {formatSats(participant.shareSats)} | 
                        Paid: {formatSats(participant.paidSats)}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      participant.status === 'paid' ? 'bg-green-100 text-green-800' :
                      participant.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      participant.status === 'overpaid' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {participant.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Request History</h2>
        
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search by meal type or participant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <select
            className="px-3 py-2 border rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="partial">Partial</option>
            <option value="settled">Settled</option>
          </select>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : receipts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No payment requests found. Create your first request!
        </div>
      ) : (
        <div className="grid gap-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={() => setSelectedReceipt(receipt)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium capitalize">{receipt.mealType}</h3>
                      {getStatusBadge(receipt)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(receipt.createdAt).toLocaleDateString()} • 
                      {formatCurrency(receipt.amountFiat, receipt.currency)} • 
                      {receipt.participants.length} participants
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{formatSats(receipt.amountSats)}</div>
                    <div className="text-muted-foreground">
                      {receipt.participants.reduce((sum, p) => sum + p.paidSats, 0)} paid
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}