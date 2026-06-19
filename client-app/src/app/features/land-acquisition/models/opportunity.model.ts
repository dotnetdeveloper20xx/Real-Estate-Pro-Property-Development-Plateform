import { ILandOwner } from './land-owner.model';
import { IDueDiligence } from './due-diligence.model';
import { IOffer } from './offer.model';
import { IContract } from './contract.model';
import { IDocument } from './document.model';
import { IFeasibilityAssessment } from './feasibility.model';
import { IApprovalRequest } from './approval.model';

/**
 * Opportunity status values mirroring the backend OpportunityStatus enum.
 * Stored as string values for readability in API payloads.
 */
export enum OpportunityStatus {
  Identified = 'Identified',
  InitialReview = 'InitialReview',
  DueDiligence = 'DueDiligence',
  OfferMade = 'OfferMade',
  UnderContract = 'UnderContract',
  Acquired = 'Acquired',
  Withdrawn = 'Withdrawn'
}

/**
 * Full opportunity entity returned from the API.
 */
export interface IOpportunity {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly landSize: number;
  readonly status: OpportunityStatus;
  readonly source: string | null;
  readonly expectedAcquisition: string | null;
  readonly withdrawalReason: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
  readonly rowVersion: string;
}

/**
 * Detailed opportunity view including all related entities.
 */
export interface IOpportunityDetail extends IOpportunity {
  readonly landOwner: ILandOwner | null;
  readonly dueDiligences: readonly IDueDiligence[];
  readonly offers: readonly IOffer[];
  readonly contract: IContract | null;
  readonly documents: readonly IDocument[];
  readonly feasibilityAssessment: IFeasibilityAssessment | null;
  readonly approvalRequests: readonly IApprovalRequest[];
}

/**
 * Lightweight opportunity item for list/pipeline views.
 */
export interface IOpportunityListItem {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly landSize: number;
  readonly status: OpportunityStatus;
  readonly source: string | null;
  readonly expectedAcquisition: string | null;
  readonly createdAt: string;
  readonly rowVersion: string;
}

/**
 * Payload for creating a new opportunity.
 */
export interface ICreateOpportunity {
  readonly name: string;
  readonly location: string;
  readonly county?: string | null;
  readonly landSize: number;
  readonly siteType?: string | null;
  readonly currentUse?: string | null;
  readonly tenure?: string | null;
  readonly description?: string | null;
  readonly source?: string | null;
  readonly expectedAcquisition?: string | null;
}

/**
 * Payload for updating an existing opportunity.
 */
export interface IUpdateOpportunity {
  readonly name: string;
  readonly location: string;
  readonly county?: string | null;
  readonly landSize: number;
  readonly siteType?: string | null;
  readonly currentUse?: string | null;
  readonly tenure?: string | null;
  readonly description?: string | null;
  readonly source?: string | null;
  readonly expectedAcquisition?: string | null;
  readonly rowVersion: string;
}
