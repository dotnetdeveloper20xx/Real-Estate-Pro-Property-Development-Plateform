# BuildEstate Pro — Future Application Map

> Auto-generated from the Angular routing and sidebar configuration.  
> Last updated: 7 June 2026

## Status Legend

| Badge | Meaning |
|-------|---------|
| ✅ Built | Fully implemented with real functionality |
| 🟡 Partial | API/backend exists, dedicated page is a placeholder with guidance |
| ⬜ Planned | Not yet implemented, shows polished placeholder |

---

## Module Map

| Module | Submenu | Route | Status | Component |
|--------|---------|-------|--------|-----------|
| **Overview** | Dashboard | `/dashboard` | ✅ Built | DashboardComponent |
| **Land Acquisition** | Opportunities | `/opportunities` | ✅ Built | OpportunityListComponent |
| | Opportunity Detail | `/opportunities/:id` | ✅ Built | OpportunityDetailComponent |
| | Create Opportunity | `/opportunities/new` | ✅ Built | OpportunityFormComponent |
| | Edit Opportunity | `/opportunities/:id/edit` | ✅ Built | OpportunityEditComponent |
| | Due Diligence | `/due-diligence` | 🟡 Partial | FuturePageComponent (placeholder) |
| | Acquisition Dashboard | `/acquisition/dashboard` | 🟡 Partial | FuturePageComponent (placeholder) |
| **Planning & Approvals** | Applications | `/planning` | ✅ Built | PlanningListComponent |
| | Create Application | `/planning/new` | ✅ Built | PlanningFormComponent |
| | Application Detail | `/planning/:id` | ✅ Built | PlanningDetailComponent |
| | Edit Application | `/planning/:id/edit` | ✅ Built | PlanningEditComponent |
| **Legal & Compliance** | Contracts | `/legal/contracts` | ✅ Built | ContractListComponent |
| | Create Contract | `/legal/contracts/new` | ✅ Built | ContractFormComponent |
| | Contract Detail | `/legal/contracts/:id` | ✅ Built | ContractDetailComponent |
| | Compliance | `/legal/compliance` | 🟡 Partial | FuturePageComponent (placeholder) |
| | Tasks | `/legal/tasks` | ✅ Built | LegalTasksComponent |
| **Design & Construction** | Dashboard | `/construction` | ⬜ Planned | FuturePageComponent (placeholder) |
| | Projects | `/construction/projects` | ⬜ Planned | FuturePageComponent (placeholder) |
| | Inspections | `/construction/inspections` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Procurement & Materials** | Orders & Materials | `/procurement` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Contractors & Suppliers** | Contractors | `/contractors` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Finance & Budget** | Budget & Costs | `/finance` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Investors & Funding** | Investors | `/investors` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Property Units** | Units | `/units` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Sales & Marketing** | Sales | `/sales` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Rental Management** | Rentals | `/rentals` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Documents & Knowledge** | Documents | `/documents` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Reports & Dashboards** | Reports | `/reports` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Administration** | Users | `/admin/users` | ⬜ Planned | FuturePageComponent (placeholder) |
| | Audit Log | `/admin/audit` | ⬜ Planned | FuturePageComponent (placeholder) |
| | Settings | `/admin/settings` | ⬜ Planned | FuturePageComponent (placeholder) |
| **Support** | Help Centre | `/help` | ✅ Built | HelpCentreComponent |
| | Release Notes | `/help/release-notes` | ✅ Built | ReleaseNotesComponent |
| | Learning Paths | `/help/learning-paths` | ✅ Built | LearningPathsComponent |
| | User Bible | `/help/user-bible` | ✅ Built | UserBibleComponent |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Built (real pages) | 18 |
| 🟡 Partial (API exists, placeholder page) | 3 |
| ⬜ Planned (placeholder only) | 14 |
| **Total navigable pages** | **35** |

---

## Technical Implementation

- **PlaceholderPageComponent** (`shared/components/placeholder-page/`) — Reusable, data-driven placeholder
- **FuturePageComponent** (`features/future/`) — Route-level component that reads `data.pageKey` from route config
- **future-pages.data.ts** — Configuration for all placeholder pages (title, description, features, KPIs, related pages)
- **Sidebar** — `NavItem.status` field drives badge display (Built / Partial / Planned)
- **No 404s** — Every sidebar link resolves to a valid Angular route

---

## Notes

- Placeholder pages are designed to be informative, not empty
- Each placeholder shows planned features, expected KPIs, and related pages
- As modules are implemented, routes simply switch from FuturePageComponent to the real component
- The sidebar status badges update by changing `status: 'planned'` to `status: 'built'`
