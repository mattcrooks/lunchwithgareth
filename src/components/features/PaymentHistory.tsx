import React, { useState } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PaymentRequest {
  id: string;
  date: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Other';
  totalAmount: number;
  totalSats: number;
  participants: number;
  status: 'pending' | 'partial' | 'settled';
  paidAmount: number;
}

export const PaymentHistory: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'settled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const requests: PaymentRequest[] = [
    {
      id: '1',
      date: '2024-01-15T12:30:00',
      mealType: 'Lunch',
      totalAmount: 45.50,
      totalSats: 1250,
      participants: 3,
      status: 'partial',
      paidAmount: 800
    },
    {
      id: '2',
      date: '2024-01-14T19:15:00',
      mealType: 'Dinner',
      totalAmount: 120.00,
      totalSats: 3333,
      participants: 4,
      status: 'settled',
      paidAmount: 3333
    },
    {
      id: '3',
      date: '2024-01-13T08:45:00',
      mealType: 'Breakfast',
      totalAmount: 28.75,
      totalSats: 800,
      participants: 2,
      status: 'pending',
      paidAmount: 0
    }
  ];

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

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesSearch = request.mealType.toLowerCase().includes(searchQuery.toLowerCase());
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
              placeholder="Search by meal type..."
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
                onClick={() => setFilter(filterOption.id as any)}
                className="whitespace-nowrap"
              >
                {filterOption.label} ({filterOption.count})
              </Button>
            ))}
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
                      <Badge variant={getStatusVariant(request.status) as any} className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(request.date)} • {request.participants} people
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <QrCode className="w-4 h-4" />
                  </Button>
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
                          style={{ width: `${(request.paidAmount / request.totalSats) * 100}%` }}
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};