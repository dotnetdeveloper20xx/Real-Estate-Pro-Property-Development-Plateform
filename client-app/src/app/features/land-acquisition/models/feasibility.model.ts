/**
 * Feasibility scenario values mirroring the backend FeasibilityScenario enum.
 */
export enum FeasibilityScenario {
  BestCase = 'BestCase',
  Expected = 'Expected',
  WorstCase = 'WorstCase'
}

/**
 * Full feasibility assessment entity returned from the API.
 */
export interface IFeasibilityAssessment {
  readonly id: string;
  readonly opportunityId: string;
  readonly estimatedLandCost: number;
  readonly estimatedBuildCost: number;
  readonly professionalFees: number;
  readonly financeCosts: number;
  readonly expectedSalesRevenue: number;
  readonly totalCosts: number;
  readonly estimatedProfit: number;
  readonly roiPercentage: number;
  readonly scenario: FeasibilityScenario;
  readonly isReadyForReview: boolean;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string | null;
  readonly updatedBy: string | null;
}

/**
 * Payload for creating or updating a feasibility assessment.
 */
export interface ICreateFeasibility {
  readonly estimatedLandCost: number;
  readonly estimatedBuildCost: number;
  readonly professionalFees: number;
  readonly financeCosts: number;
  readonly expectedSalesRevenue: number;
  readonly scenario: FeasibilityScenario;
}
