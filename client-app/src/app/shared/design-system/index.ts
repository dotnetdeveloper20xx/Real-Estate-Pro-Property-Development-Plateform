/**
 * BuildEstate Pro Design System — Public API
 *
 * This barrel export provides a single entry point for all design system
 * components, services, and utilities consumed by feature modules.
 */

// --- Services ---
export { DisplayPreferenceService } from './services/display-preference.service';
export { ThemeEngineService } from './services/theme-engine.service';
export { FontScaleService } from './services/font-scale.service';
export type { FontScale } from './services/font-scale.service';
export type { IUserPreferences, IPreferencesState, INotificationPreferences } from './services/state/preferences.state';
export { DEFAULT_USER_PREFERENCES } from './services/state/preferences.state';

// --- NgRx Preferences State ---
export { PreferencesActions } from './services/state/preferences.actions';
export { preferencesReducer } from './services/state/preferences.reducer';
export { PreferencesEffects } from './services/state/preferences.effects';
export {
  selectPreferencesState,
  selectPreferences,
  selectPreferencesLoading,
  selectPreferencesSaving,
  selectPreferencesError,
  selectLastSaved,
  selectTheme,
  selectFontScale,
  selectDensity,
  selectDateFormat,
} from './services/state/preferences.selectors';

// --- Modal System ---
export { ModalComponent } from './modals/modal/modal.component';
export type { ModalSize } from './modals/modal/modal.component';

// --- Table System ---
export { DataTableComponent } from './tables/data-table/data-table.component';
export type {
  IColumnDefinition,
  IBadgeMapEntry as ITableBadgeMapEntry,
  ITableAction,
  ISavedView,
  IPageChangeEvent,
  ISortChangeEvent,
  IActionClickEvent,
  IBulkActionEvent,
  IExportRequestEvent,
} from './tables/data-table/data-table.component';

// --- Filter System ---
export { FilterBarComponent } from './filters/filter-bar/filter-bar.component';
export type {
  FilterType,
  IFilterDefinition,
  IFilterOption,
  IFilterPreset,
  IDateRangeValue,
} from './filters/filter-bar/filter-bar.component';

// --- Form System ---
export { BaseFormControl } from './forms/shared/base-form-control';
export { SelectComponent } from './forms/select/select.component';
export { MultiSelectComponent } from './forms/multi-select/multi-select.component';
export { ToggleComponent } from './forms/toggle/toggle.component';
export { CheckboxGroupComponent } from './forms/checkbox-group/checkbox-group.component';
export { RadioGroupComponent } from './forms/radio-group/radio-group.component';
export { TextInputComponent } from './forms/text-input/text-input.component';
export { TextareaComponent } from './forms/textarea/textarea.component';
export { NumberInputComponent } from './forms/number-input/number-input.component';
export { EmailInputComponent } from './forms/email-input/email-input.component';
export { PasswordInputComponent } from './forms/password-input/password-input.component';
export { PhoneInputComponent } from './forms/phone-input/phone-input.component';

// --- Currency System ---
export { CurrencyDisplayComponent } from './currency/currency-display/currency-display.component';
export type { NegativeFormat, CurrencyMode } from './currency/currency-display/currency-display.component';

// --- Date System ---
export { DateDisplayComponent } from './dates/date-display/date-display.component';
export { DatePickerComponent } from './dates/date-picker/date-picker.component';
export { DateRangeComponent } from './dates/date-range/date-range.component';
export type { IDateRangeValue as IDateRangePickerValue } from './dates/date-range/date-range.component';

// --- Upload System ---
export { FileUploadComponent } from './uploads/file-upload/file-upload.component';
export type { IFileEntry, FileUploadStatus } from './uploads/file-upload/file-upload.component';

// --- Badge System ---
export { BaseBadgeComponent } from './badges/base-badge.component';
export type { IBadgeMapEntry, BadgeSize } from './badges/base-badge.component';
export { StatusBadgeComponent } from './badges/status-badge/status-badge.component';
export { PriorityBadgeComponent } from './badges/priority-badge/priority-badge.component';
export { StageBadgeComponent } from './badges/stage-badge/stage-badge.component';
export { RiskBadgeComponent } from './badges/risk-badge/risk-badge.component';

// --- Confirmation Dialog System ---
export { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
export type { ConfirmDialogSeverity, ConfirmDialogResolution } from './dialogs/confirm-dialog/confirm-dialog.component';
export { ConfirmDialogService } from './services/confirm-dialog.service';
export type { IConfirmDialogOptions } from './services/confirm-dialog.service';

// --- Loading System ---
export { LoadingSpinnerComponent } from './loading/loading-spinner/loading-spinner.component';
export { LoadingOverlayComponent } from './loading/loading-overlay/loading-overlay.component';
export { LoadingButtonComponent } from './loading/loading-button/loading-button.component';
export { SkeletonCardComponent } from './loading/skeleton-card/skeleton-card.component';
export { SkeletonTableComponent } from './loading/skeleton-table/skeleton-table.component';
export { SkeletonFormComponent } from './loading/skeleton-form/skeleton-form.component';

// --- Empty State System ---
export { EmptyStateComponent } from './empty-states/empty-state/empty-state.component';

// --- Preferences ---
export { PreferencesPageComponent } from './preferences/preferences-page/preferences-page.component';
export { PreviewLabComponent } from './preferences/preview-lab/preview-lab.component';

// --- Dashboard ---
export { KpiCardComponent } from './dashboard/kpi-card/kpi-card.component';
export type { IKpiTrend, TrendDirection } from './dashboard/kpi-card/kpi-card.component';

// --- Timeline ---
export { TimelineComponent } from './timeline/timeline.component';
export type { ITimelineItem } from './timeline/timeline.component';

// --- Stepper ---
export { LifecycleStepperComponent } from './stepper/lifecycle-stepper.component';
export type { ILifecycleStep } from './stepper/lifecycle-stepper.component';

// --- Pipeline ---
export { PipelineColumnComponent } from './pipeline/pipeline-column.component';

// --- Document Upload ---
export { DocumentUploadComponent } from './uploads/document-upload/document-upload.component';
export type { IDocumentTypeOption } from './uploads/document-upload/document-upload.component';

// --- Status Transition Dialog ---
export { StatusTransitionDialogComponent } from './dialogs/status-transition-dialog/status-transition-dialog.component';
export type { IStatusTransitionEvent } from './dialogs/status-transition-dialog/status-transition-dialog.component';

// --- Approval Workflow ---
export { ApprovalPanelComponent } from './workflows/approval-panel/approval-panel.component';
export type { IApprovalRequest, IApprovalDecision, IRejectionDecision } from './workflows/approval-panel/approval-panel.component';

// --- Notifications ---
export { NotificationPanelComponent, getNotificationIcon } from './notifications/notification-panel/notification-panel.component';
