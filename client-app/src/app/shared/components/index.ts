// Consolidated shared components (still in active use)
export { KpiCardComponent } from './kpi-card/kpi-card.component';
export type { IKpiTrend, TrendDirection } from './kpi-card/kpi-card.component';

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

export { NotificationPanelComponent, getNotificationIcon } from './notification-panel/notification-panel.component';


// ─── Design System Re-exports (Compatibility Layer) ──────────────────────────
// These re-exports allow existing consumers to import from shared/components
// while the underlying implementations have moved to shared/design-system/.
// Once all consumers are migrated, these can be removed.

// Modal System
export { ModalComponent } from '../design-system/modals/modal/modal.component';

// Table System
export { DataTableComponent } from '../design-system/tables/data-table/data-table.component';

// Filter System
export { FilterBarComponent } from '../design-system/filters/filter-bar/filter-bar.component';

// Form System
export { TextInputComponent } from '../design-system/forms/text-input/text-input.component';
export { TextareaComponent } from '../design-system/forms/textarea/textarea.component';
export { NumberInputComponent } from '../design-system/forms/number-input/number-input.component';
export { EmailInputComponent } from '../design-system/forms/email-input/email-input.component';
export { PasswordInputComponent } from '../design-system/forms/password-input/password-input.component';
export { PhoneInputComponent } from '../design-system/forms/phone-input/phone-input.component';
export { SelectComponent } from '../design-system/forms/select/select.component';
export { MultiSelectComponent } from '../design-system/forms/multi-select/multi-select.component';
export { ToggleComponent } from '../design-system/forms/toggle/toggle.component';
export { CheckboxGroupComponent } from '../design-system/forms/checkbox-group/checkbox-group.component';
export { RadioGroupComponent } from '../design-system/forms/radio-group/radio-group.component';

// Currency System
export { CurrencyDisplayComponent } from '../design-system/currency/currency-display/currency-display.component';

// Date System
export { DateDisplayComponent } from '../design-system/dates/date-display/date-display.component';
export { DatePickerComponent } from '../design-system/dates/date-picker/date-picker.component';
export { DateRangeComponent } from '../design-system/dates/date-range/date-range.component';

// Upload System
export { FileUploadComponent } from '../design-system/uploads/file-upload/file-upload.component';

// Badge System
export { StatusBadgeComponent as DsStatusBadgeComponent } from '../design-system/badges/status-badge/status-badge.component';
export { PriorityBadgeComponent } from '../design-system/badges/priority-badge/priority-badge.component';
export { StageBadgeComponent } from '../design-system/badges/stage-badge/stage-badge.component';
export { RiskBadgeComponent } from '../design-system/badges/risk-badge/risk-badge.component';

// Confirmation Dialog
export { ConfirmDialogComponent } from '../design-system/dialogs/confirm-dialog/confirm-dialog.component';
export { ConfirmDialogService } from '../design-system/services/confirm-dialog.service';

// Loading System
export { LoadingSpinnerComponent } from '../design-system/loading/loading-spinner/loading-spinner.component';
export { LoadingOverlayComponent } from '../design-system/loading/loading-overlay/loading-overlay.component';
export { LoadingButtonComponent } from '../design-system/loading/loading-button/loading-button.component';
export { SkeletonCardComponent } from '../design-system/loading/skeleton-card/skeleton-card.component';
export { SkeletonTableComponent } from '../design-system/loading/skeleton-table/skeleton-table.component';
export { SkeletonFormComponent } from '../design-system/loading/skeleton-form/skeleton-form.component';

// Empty State
export { EmptyStateComponent } from '../design-system/empty-states/empty-state/empty-state.component';

// Services
export { DisplayPreferenceService } from '../design-system/services/display-preference.service';
export { ThemeEngineService } from '../design-system/services/theme-engine.service';
export { FontScaleService } from '../design-system/services/font-scale.service';
