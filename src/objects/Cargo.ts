export interface Cargo {
  id: string;
  destinationId: string;
  sourceId: string;
  payout: number;
  expiresAt: number; // gametime timestamp
  description: string;
}
