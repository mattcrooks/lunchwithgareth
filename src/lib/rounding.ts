import type { Participant } from '../types/models';

export function splitEqual(totalSats: number, participants: Participant[]): Participant[] {
  const perPersonSats = Math.floor(totalSats / participants.length);
  
  return participants.map(participant => ({
    ...participant,
    shareSats: perPersonSats,
    paidSats: 0,
    status: 'pending' as const
  }));
}

export function splitCustom(totalSats: number, participants: Participant[], customShares: number[]): Participant[] {
  const totalShares = customShares.reduce((sum, share) => sum + share, 0);
  
  return participants.map((participant, index) => {
    const shareRatio = customShares[index] / totalShares;
    const shareSats = Math.floor(totalSats * shareRatio);
    
    return {
      ...participant,
      shareSats,
      paidSats: 0,
      status: 'pending' as const
    };
  });
}

export function calculatePaymentStatus(participant: Participant): 'pending' | 'partial' | 'paid' | 'overpaid' {
  if (participant.paidSats === 0) return 'pending';
  if (participant.paidSats < participant.shareSats) return 'partial';
  if (participant.paidSats === participant.shareSats) return 'paid';
  return 'overpaid';
}

export function getTotalOwed(participants: Participant[]): number {
  return participants.reduce((sum, p) => sum + p.shareSats, 0);
}

export function getTotalPaid(participants: Participant[]): number {
  return participants.reduce((sum, p) => sum + p.paidSats, 0);
}

export function getOverallStatus(participants: Participant[]): 'open' | 'partial' | 'settled' | 'overpaid' {
  const totalOwed = getTotalOwed(participants);
  const totalPaid = getTotalPaid(participants);
  
  if (totalPaid === 0) return 'open';
  if (totalPaid < totalOwed) return 'partial';
  if (totalPaid === totalOwed) return 'settled';
  return 'overpaid';
}