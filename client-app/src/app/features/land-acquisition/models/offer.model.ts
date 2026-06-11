/**
 * Offer status values mirroring the backend OfferStatus enum.
 */
export enum OfferStatus {
  UnderReview = 'UnderReview',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  CounterOffered = 'CounterOffered',
  Expired = 'Expired'
}

/**
 * Full offer entity returned from the API.
 */
export interface IOffer {
  readonly id: string;
  readonly opportunityId: string;
  readonly amount: number;
  readonly currency: string;
  readonly offerDate: string;
  readonly validUntil: string;
  readonly status: OfferStatus;
  readonly counterOfferAmount: number | null;
  readonly originalOfferId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/**
 * Payload for creating a new offer.
 */
export interface ICreateOffer {
  readonly amount: number;
  readonly currency: string;
  readonly validUntil: string;
}
