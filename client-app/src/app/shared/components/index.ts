// Existing shared components
export { DataGridComponent } from './data-grid/data-grid.component';
export type { IGridColumn, IFilterOption, ISortEvent } from './data-grid/data-grid.component';
export { CurrencyInputComponent } from './currency-input/currency-input.component';

// Consolidated shared components
export { KpiCardComponent } from './kpi-card/kpi-card.component';
export type { IKpiTrend, TrendDirection } from './kpi-card/kpi-card.component';

export { StatusBadgeComponent } from './status-badge/status-badge.component';
export type { IBadgeMapEntry } from './status-badge/status-badge.component';

export { TimelineComponent } from './timeline/timeline.component';
export type { ITimelineItem } from './timeline/timeline.component';

export { LifecycleStepperComponent } from './lifecycle-stepper/lifecycle-stepper.component';
export type { ILifecycleStep } from './lifecycle-stepper/lifecycle-stepper.component';

export { PipelineColumnComponent } from './pipeline-column/pipeline-column.component';

export { DocumentUploadComponent } from './document-upload/document-upload.component';
export type { IDocumentTypeOption } from './document-upload/document-upload.component';

export { StatusTransitionDialogComponent } from './status-transition-dialog/status-transition-dialog.component';
export type { IStatusTransitionEvent } from './status-transition-dialog/status-transition-dialog.component';

export { ApprovalPanelComponent } from './approval-panel/approval-panel.component';
export type { IApprovalRequest, IApprovalDecision, IRejectionDecision } from './approval-panel/approval-panel.component';
