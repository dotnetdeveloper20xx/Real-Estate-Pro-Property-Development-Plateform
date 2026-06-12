import { IPlanningCondition } from './planning-condition.model';
import { IPlanningAppeal } from './planning-appeal.model';
import { IPlanningDocument } from './planning-document.model';
import { IPlanningFee } from './planning-fee.model';
import { IPlanningMilestone } from './planning-milestone.model';
import { ICouncilContact } from './council-contact.model';

/**
 * Planning application status values mirroring the backend PlanningApplicationStatus enum.
 */
export enum PlanningApplicationStatus {
  PreApplication = 'PreApplication',
  Submitted = 'Submitted',
  Validated = 'Validated',
  UnderReview = 'UnderReview',
  CommitteeReview = 'CommitteeReview',
  Approved = 'Approved',
  ApprovedWithConditions = 'ApprovedWithConditions',
  Refused = 'Refused',
  Appeal = 'Appeal',
  Withdrawn = 'Withdrawn'
}

/**
 * Planning application type values mirroring the backend PlanningApplicationType enum.
 */
export enum PlanningApplicationType {
  Full = 'Full',
  Outline = 'Outline',
  ReservedMatters = 'ReservedMatters',
  Householder = 'Householder',
  ListedBuilding = 'ListedBuilding',
  ChangeOfUse = 'ChangeOfUse'
}

/**
 * Lightweight summary of the linked LandOpportunity displayed in planning views.
 */
export interface IOpportunitySummary {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly landSize: number;
  readonly status: string;
}

/**
 * Full planning application entity returned from the API.
 */
export interface IPlanningApplication {
  readonly id: string;
  readonly opportunityId: string;
  readonly description: string;
  readonly applicationType: string;
  readonly status: string;
  readonly applicationReference: string | null;
  readonly councilName: string;
  readonly submissionDate: string | null;
  readonly targetDecisionDate: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
}

/**
 * Lightweight application item for list/pipeline views.
 */
export interface IApplicationListItem {
  readonly id: string;
  readonly opportunityId: string;
  readonly description: string;
  readonly applicationType: string;
  readonly status: string;
  readonly applicationReference: string | null;
  readonly councilName: string;
  readonly landOpportunityName: string | null;
  readonly submissionDate: string | null;
  readonly targetDecisionDate: string | null;
  readonly createdAt: string;
}

/**
 * Rich detail view of a single planning application including all related entities.
 */
export interface IApplicationDetail {
  readonly id: string;
  readonly opportunityId: string;
  readonly description: string;
  readonly applicationType: string;
  readonly status: string;
  readonly applicationReference: string | null;
  readonly councilName: string;
  readonly submissionDate: string | null;
  readonly targetDecisionDate: string | null;
  readonly actualDecisionDate: string | null;
  readonly decisionDate: string | null;
  readonly withdrawalReason: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
  readonly councilContact: ICouncilContact | null;
  readonly conditions: readonly IPlanningCondition[];
  readonly appeals: readonly IPlanningAppeal[];
  readonly documents: readonly IPlanningDocument[];
  readonly fees: readonly IPlanningFee[];
  readonly milestones: readonly IPlanningMilestone[];
  readonly opportunity: IOpportunitySummary | null;
}

/**
 * Summary DTO used for Land Acquisition module integration.
 */
export interface IApplicationSummary {
  readonly id: string;
  readonly description: string;
  readonly applicationType: string;
  readonly status: string;
  readonly councilName: string;
  readonly submissionDate: string | null;
  readonly createdAt: string;
}

/**
 * Payload for creating a new planning application.
 */
export interface ICreateApplication {
  readonly opportunityId: string;
  readonly applicationType: string;
  readonly description: string;
  readonly councilName: string;
}

/**
 * Payload for updating an existing planning application.
 */
export interface IUpdateApplication {
  readonly description: string;
  readonly applicationType: string;
  readonly councilName: string;
  readonly targetDecisionDate?: string | null;
}

/**
 * Payload for transitioning a planning application status.
 */
export interface ITransitionApplicationStatus {
  readonly newStatus: string;
  readonly applicationReference?: string | null;
  readonly decisionDate?: string | null;
  readonly withdrawalReason?: string | null;
}
