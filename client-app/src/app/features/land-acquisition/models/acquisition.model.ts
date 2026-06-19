/**
 * Acquisition status values mirroring the backend AcquisitionStatus enum.
 * Tracks land registry and ownership transfer progress.
 */
export enum AcquisitionStatus {
  Completed = 'Completed',
  Registered = 'Registered'
}

/**
 * Land acquisition record returned from the API.
 * Represents a completed land purchase with registry details.
 */
export interface ILandAcquisitionRecord {
  readonly id: string;
  readonly opportunityId: string;
  readonly purchasePrice: number;
  readonly completionDate: string;
  readonly registryRef: string;
  readonly status: AcquisitionStatus;
  readonly createdAt: string;
}

/**
 * Payload for creating a new land acquisition record.
 */
export interface ICreateAcquisition {
  readonly purchasePrice: number;
  readonly completionDate: string;
  readonly registryRef: string;
}
