// Enhanced PaymentHistory component with real data integration
// Implements REQ-UI-001: Prior events view with filters

import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertCircle, QrCode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { storage, StoredReceipt } from '@/lib/storage';
import { contactManager } from '@/lib/contacts';

type FilterType = 'all' | 'pending' | 'partial' | 'settled';

interface PaymentRequest {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  totalAmount: number;
  totalSats: number;
  participants: number;
  status: 'pending' | 'partial' | 'settled';
  paidAmount: number;
  eventId?: string;
  syncStatus: 'local' | 'published' | 'failed';
}

export const PaymentHistoryEnhanced: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);

  // Load payment requests from storage
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const storedReceipts = await storage.getAllReceipts();
      
      const mappedRequests: PaymentRequest[] = storedReceipts.map(receipt => {
        const totalPaid = receipt.participants.reduce((sum, p) => sum + p.paidSats, 0);
        
        let status: 'pending' | 'partial' | 'settled' = 'pending';
        if (totalPaid === 0) {
          status = 'pending';
        } else if (totalPaid >= receipt.amountSats) {
          status = 'settled';
        } else {
          status = 'partial';
        }

        return {
          id: receipt.id,
          date: new Date(receipt.createdAt).toISOString(),
          mealType: receipt.mealType,
          totalAmount: receipt.amountFiat,
          totalSats: receipt.amountSats,
          participants: receipt.participants.length,
          status,
          paidAmount: totalPaid,
          eventId: receipt.noteEventId,
          syncStatus: receipt.syncStatus
        };
      });

      setRequests(mappedRequests);
    } catch (error) {
      console.error('Failed to load payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4" />;
      case 'settled':
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'partial':
        return 'destructive';
      case 'settled':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBg = (status: PaymentRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 border-warning/20';
      case 'partial':
        return 'bg-destructive/10 border-destructive/20';
      case 'settled':
        return 'bg-accent/10 border-accent/20';
    }
  };

  const getSyncStatusBadge = (syncStatus: PaymentRequest['syncStatus']) => {
    switch (syncStatus) {
      case 'local':
        return <Badge variant="outline" className="text-xs">Local</Badge>;
      case 'published':
        return <Badge variant="default" className="text-xs">Published</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = searchQuery === '' || 
      request.mealType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateQRData = (request: PaymentRequest) => {
    if (request.eventId) {
      // Create a nostr: URI or deeplink
      return `nostr:${request.eventId}`;
    }
    return request.id; // Fallback to request ID
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment History</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading requests...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment History</h1>
        <p className="text-muted-foreground">Track your bill splitting requests</p>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by meal type or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All', count: requests.length },
              { id: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
              { id: 'partial', label: 'Partial', count: requests.filter(r => r.status === 'partial').length },
              { id: 'settled', label: 'Settled', count: requests.filter(r => r.status === 'settled').length },
            ].map((filterOption) => (
              <Button
                key={filterOption.id}
                variant={filter === filterOption.id ? "gradient" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption.id as FilterType)}
                className="whitespace-nowrap"
              >
                {filterOption.label} ({filterOption.count})
              </Button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={loadRequests}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === 'all' 
                  ? "You haven't created any payment requests yet."
                  : `No ${filter} requests found.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className={`shadow-card ${getStatusBg(request.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{request.mealType}</h3>
                      <Badge variant={getStatusVariant(request.status) as 'secondary'} className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </Badge>
                      {getSyncStatusBadge(request.syncStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.date)} • {request.participants} people
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Share Request</DialogTitle>
                        </DialogHeader>
                        <div className="text-center space-y-4">
                          <div className="bg-white p-4 rounded-lg inline-block">
                            {/* QR Code would be generated here */}
                            <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                              <QrCode className="w-16 h-16 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Scan to view payment request</p>
                            <p className="font-mono text-xs break-all mt-2">
                              {generateQRData(request)}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-semibold">${request.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{request.totalSats.toLocaleString()} sats</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((request.paidAmount / request.totalSats) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {Math.round((request.paidAmount / request.totalSats) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {request.paidAmount.toLocaleString()} / {request.totalSats.toLocaleString()} sats
                    </p>
                  </div>
                </div>

                {request.eventId && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Event ID: {request.eventId.slice(0, 16)}...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
