/**
 * Planning document type values mirroring the backend PlanningDocumentType enum.
 */
export enum PlanningDocumentType {
  SitePlan = 'SitePlan',
  FloorPlan = 'FloorPlan',
  ElevationDrawing = 'ElevationDrawing',
  DesignAndAccessStatement = 'DesignAndAccessStatement',
  EnvironmentalImpactAssessment = 'EnvironmentalImpactAssessment',
  CouncilCorrespondence = 'CouncilCorrespondence',
  PlanningOfficerReport = 'PlanningOfficerReport',
  SupportingStatement = 'SupportingStatement'
}

/**
 * Full planning document entity returned from the API.
 */
export interface IPlanningDocument {
  readonly id: string;
  readonly applicationId: string;
  readonly documentType: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSizeBytes: number;
  readonly storagePath: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
  readonly createdAt: string;
}
