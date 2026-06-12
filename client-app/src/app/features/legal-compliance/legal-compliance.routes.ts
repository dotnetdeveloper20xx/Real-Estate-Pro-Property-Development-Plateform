import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { legalRoleGuard } from './guards/legal-role.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';

// Store imports — reducers
import { legalCasesReducer } from './store/legal-cases';
import { contractsReducer } from './store/contracts';
import { complianceReducer } from './store/compliance';
import { insuranceReducer } from './store/insurance';
import { auditRecordReducer } from './store/audit-records';
import { documentsReducer } from './store/documents';
import { dashboardReducer } from './store/dashboard';

// Store imports — effects
import { LegalCasesEffects } from './store/legal-cases';
import { ContractsEffects } from './store/contracts';
import { ComplianceEffects } from './store/compliance';
import { InsuranceEffects } from './store/insurance';
import { AuditRecordEffects } from './store/audit-records';
import { DocumentsEffects } from './store/documents';
import { DashboardEffects } from './store/dashboard';

/**
 * Legal & Compliance feature routes with lazy-loaded standalone components.
 *
 * Route structure:
 *   /legal-compliance                                    → redirects to dashboard
 *   /legal-compliance/dashboard                          → Dashboard overview (KPIs, metrics, alerts)
 *   /legal-compliance/cases                              → Legal cases list / pipeline
 *   /legal-compliance/cases/pipeline                     → Pipeline board (cases grouped by status)
 *   /legal-compliance/cases/create                       → Create legal case (guarded)
 *   /legal-compliance/cases/:id                          → Legal case detail view
 *   /legal-compliance/cases/:id/edit                     → Edit legal case (guarded)
 *   /legal-compliance/contracts                          → Contract register list
 *   /legal-compliance/contracts/create                   → Create contract (guarded)
 *   /legal-compliance/contracts/:id                      → Contract detail view
 *   /legal-compliance/contracts/:id/edit                 → Edit contract (guarded)
 *   /legal-compliance/compliance/checklist               → Compliance checklist
 *   /legal-compliance/compliance/:id                     → Compliance requirement detail
 *   /legal-compliance/compliance/checks/new              → Record compliance check (guarded)
 *   /legal-compliance/insurance                          → Insurance records list
 *   /legal-compliance/insurance/create                   → Create insurance record (guarded)
 *   /legal-compliance/insurance/:id                      → Insurance record detail
 *   /legal-compliance/insurance/:id/edit                 → Edit insurance record (guarded)
 *   /legal-compliance/audit-records                      → Audit records list
 *   /legal-compliance/audit-records/create               → Create audit record (guarded)
 *
 * All routes are protected by legalRoleGuard which enforces that the user
 * holds an appropriate legal role (Legal_Compliance_Officer, Finance_Director,
 * Acquisition_Manager, or Admin_Support).
 *
 * Write routes (create, edit) additionally use the unsavedChangesGuard
 * to prevent accidental navigation away from unsaved form data.
 *
 * NgRx feature states are registered via the route providers array,
 * ensuring lazy loading of store slices alongside their feature routes.
 *
 * Requirements: 10.1, 10.7, 10.8, 10.9, 17.1, 17.2
 */
export const legalComplianceRoutes: Routes = [
  {
    path: '',
    canActivate: [legalRoleGuard],
    providers: [
      provideState('legalCases', legalCasesReducer),
      provideState('contracts', contractsReducer),
      provideState('compliance', complianceReducer),
      provideState('insurance', insuranceReducer),
      provideState('auditRecords', auditRecordReducer),
      provideState('legalDocuments', documentsReducer),
      provideState('legalDashboard', dashboardReducer),
      provideEffects([
        LegalCasesEffects,
        ContractsEffects,
        ComplianceEffects,
        InsuranceEffects,
        AuditRecordEffects,
        DocumentsEffects,
        DashboardEffects
      ])
    ],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // ── Dashboard ──────────────────────────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./containers/dashboard/legal-dashboard.component').then(
            m => m.LegalDashboardComponent
          ),
        data: { breadcrumb: 'Dashboard' }
      },

      // ── Legal Cases ────────────────────────────────────────────────────────
      {
        path: 'cases',
        loadComponent: () =>
          import('./containers/legal-case-list/legal-case-list.component').then(
            m => m.LegalCaseListComponent
          ),
        data: { breadcrumb: 'Legal Cases' }
      },
      {
        path: 'cases/pipeline',
        loadComponent: () =>
          import('./containers/legal-case-list/legal-case-list.component').then(
            m => m.LegalCaseListComponent
          ),
        data: { breadcrumb: 'Pipeline', viewMode: 'pipeline' }
      },
      {
        path: 'cases/create',
        loadComponent: () =>
          import('./containers/legal-case-create/legal-case-create.component').then(
            m => m.LegalCaseCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Create Case' }
      },
      {
        path: 'cases/:id',
        loadComponent: () =>
          import('./containers/legal-case-detail/legal-case-detail.container').then(
            m => m.LegalCaseDetailContainer
          ),
        data: { breadcrumb: 'Case Detail' }
      },
      {
        path: 'cases/:id/edit',
        loadComponent: () =>
          import('./containers/legal-case-create/legal-case-create.component').then(
            m => m.LegalCaseCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Edit Case', editMode: true }
      },

      // ── Contracts ──────────────────────────────────────────────────────────
      {
        path: 'contracts',
        loadComponent: () =>
          import('./containers/contract-list/contract-list.component').then(
            m => m.ContractListComponent
          ),
        data: { breadcrumb: 'Contracts' }
      },
      {
        path: 'contracts/create',
        loadComponent: () =>
          import('./containers/contract-create/contract-create.component').then(
            m => m.ContractCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Create Contract' }
      },
      {
        path: 'contracts/:id',
        loadComponent: () =>
          import('./containers/contract-detail/contract-detail.container').then(
            m => m.ContractDetailContainer
          ),
        data: { breadcrumb: 'Contract Detail' }
      },
      {
        path: 'contracts/:id/edit',
        loadComponent: () =>
          import('./containers/contract-create/contract-create.component').then(
            m => m.ContractCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Edit Contract', editMode: true }
      },

      // ── Compliance ─────────────────────────────────────────────────────────
      {
        path: 'compliance/checklist',
        loadComponent: () =>
          import('./containers/compliance-checklist/compliance-checklist.component').then(
            m => m.ComplianceChecklistComponent
          ),
        data: { breadcrumb: 'Compliance Checklist' }
      },
      {
        path: 'compliance/checks/new',
        loadComponent: () =>
          import('./containers/compliance-check-form/compliance-check-form.component').then(
            m => m.ComplianceCheckFormComponent
          ),
        data: { breadcrumb: 'Record Compliance Check' }
      },
      {
        path: 'compliance/:id',
        loadComponent: () =>
          import('./containers/compliance-requirement-detail/compliance-requirement-detail.container').then(
            m => m.ComplianceRequirementDetailContainer
          ),
        data: { breadcrumb: 'Requirement Detail' }
      },

      // ── Insurance ──────────────────────────────────────────────────────────
      {
        path: 'insurance',
        loadComponent: () =>
          import('./containers/insurance-list/insurance-list.component').then(
            m => m.InsuranceListComponent
          ),
        data: { breadcrumb: 'Insurance Records' }
      },
      {
        path: 'insurance/create',
        loadComponent: () =>
          import('./containers/insurance-create/insurance-create.component').then(
            m => m.InsuranceCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Create Insurance Record' }
      },
      {
        path: 'insurance/:id',
        loadComponent: () =>
          import('./containers/insurance-list/insurance-list.component').then(
            m => m.InsuranceListComponent
          ),
        data: { breadcrumb: 'Insurance Detail', detailMode: true }
      },
      {
        path: 'insurance/:id/edit',
        loadComponent: () =>
          import('./containers/insurance-create/insurance-create.component').then(
            m => m.InsuranceCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Edit Insurance Record', editMode: true }
      },

      // ── Audit Records ──────────────────────────────────────────────────────
      {
        path: 'audit-records',
        loadComponent: () =>
          import('./containers/audit-record-list/audit-record-list.component').then(
            m => m.AuditRecordListComponent
          ),
        data: { breadcrumb: 'Audit Records' }
      },
      {
        path: 'audit-records/create',
        loadComponent: () =>
          import('./containers/audit-record-create/audit-record-create.component').then(
            m => m.AuditRecordCreateComponent
          ),
        canDeactivate: [unsavedChangesGuard],
        data: { breadcrumb: 'Create Audit Record' }
      }
    ]
  }
];
