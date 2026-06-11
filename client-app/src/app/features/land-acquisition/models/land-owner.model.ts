/**
 * Ownership type values mirroring the backend OwnershipType enum.
 */
export enum OwnershipType {
  Freehold = 'Freehold',
  Leasehold = 'Leasehold'
}

/**
 * Full land owner entity returned from the API.
 */
export interface ILandOwner {
  readonly id: string;
  readonly opportunityId: string;
  readonly name: string;
  readonly contactDetails: string;
  readonly address: string | null;
  readonly ownershipType: OwnershipType;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/**
 * Payload for creating a new land owner.
 */
export interface ICreateLandOwner {
  readonly name: string;
  readonly contactDetails: string;
  readonly address?: string | null;
  readonly ownershipType: OwnershipType;
}

/**
 * Payload for updating an existing land owner.
 */
export interface IUpdateLandOwner {
  readonly name: string;
  readonly contactDetails: string;
  readonly address?: string | null;
  readonly ownershipType: OwnershipType;
}
