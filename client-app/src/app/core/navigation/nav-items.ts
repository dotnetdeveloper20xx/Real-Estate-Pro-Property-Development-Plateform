/**
 * Application navigation item definition.
 * Used by the sidebar/menu component to render links.
 *
 * Role-based filtering rules:
 * - SuperAdmin: sees ALL sections including Administration
 * - AcquisitionManager: Dashboard, Land Acquisition, Reports
 * - LegalOfficer: Dashboard, Legal & Compliance, Reports
 * - FinanceDirector: Dashboard, Finance, Reports, Land Acquisition
 * - No roles: Dashboard only
 *
 * Filtering algorithm:
 * - Items with empty `roles` array are visible to all authenticated users
 * - Items with roles are visible if user has ANY matching role (set union)
 * - SuperAdmin always sees all items (implicit in having the role listed)
 *
 * Requirements: 13.1, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9
 */

/**
 * Navigation child item for sub-menu entries.
 */
export interface INavChild {
  /** Display label for the navigation link */
  readonly label: string;
  /** Router link path */
  readonly routerLink: string;
  /** Optional Material icon name */
  readonly icon?: string;
}

/**
 * Top-level navigation item with optional children for hierarchical sidebar.
 */
export interface INavItem {
  /** Display label for the navigation link */
  readonly label: string;
  /** Router link path */
  readonly routerLink: string;
  /** Material icon name */
  readonly icon: string;
  /** Roles that can see this navigation item (empty = visible to all authenticated users) */
  readonly roles: readonly string[];
  /** Whether this module is active/enabled */
  readonly enabled: boolean;
  /** Optional sub-navigation children */
  readonly children?: readonly INavChild[];
  /** Section classification */
  readonly section?: 'implemented' | 'placeholder';
}

/**
 * Main sidebar navigation items for BuildEstate Pro.
 *
 * Each item maps to a lazy-loaded feature module.
 * The sidebar component filters items by user roles from the NgRx store.
 */
export const NAV_ITEMS: readonly INavItem[] = [
  {
    label: 'Dashboard',
    routerLink: '/home',
    icon: 'dashboard',
    roles: [],  // Visible to all authenticated users
    enabled: true,
    section: 'implemented',
    children: [
      { label: 'Overview', routerLink: '/home', icon: 'home' }
    ]
  },
  {
    label: 'Land Acquisition',
    routerLink: '/land-acquisition',
    icon: 'terrain',
    roles: ['SuperAdmin', 'AcquisitionManager', 'FinanceDirector'],
    enabled: true,
    section: 'implemented',
    children: [
      { label: 'Dashboard', routerLink: '/land-acquisition/dashboard', icon: 'dashboard' },
      { label: 'Pipeline', routerLink: '/land-acquisition/pipeline', icon: 'view_kanban' },
      { label: 'Opportunities', routerLink: '/land-acquisition/opportunities', icon: 'list' },
      { label: 'New Opportunity', routerLink: '/land-acquisition/opportunities/new', icon: 'add_circle' }
    ]
  },
  {
    label: 'Planning & Approvals',
    routerLink: '/planning-approvals',
    icon: 'assignment',
    roles: ['SuperAdmin', 'PlanningManager'],
    enabled: true,
    section: 'implemented',
    children: [
      { label: 'Dashboard', routerLink: '/planning-approvals/dashboard', icon: 'dashboard' },
      { label: 'Applications', routerLink: '/planning-approvals/applications', icon: 'list' },
      { label: 'Pipeline', routerLink: '/planning-approvals/pipeline', icon: 'view_kanban' },
      { label: 'New Application', routerLink: '/planning-approvals/applications/create', icon: 'add_circle' }
    ]
  },
  {
    label: 'Legal & Compliance',
    routerLink: '/legal-compliance',
    icon: 'gavel',
    roles: ['SuperAdmin', 'LegalOfficer'],
    enabled: true,
    section: 'implemented',
    children: [
      { label: 'Dashboard', routerLink: '/legal-compliance/dashboard', icon: 'dashboard' },
      { label: 'Cases', routerLink: '/legal-compliance/cases', icon: 'work' },
      { label: 'New Case', routerLink: '/legal-compliance/cases/create', icon: 'add_circle' },
      { label: 'Contracts', routerLink: '/legal-compliance/contracts', icon: 'description' },
      { label: 'Compliance', routerLink: '/legal-compliance/compliance/checklist', icon: 'verified' },
      { label: 'Insurance', routerLink: '/legal-compliance/insurance', icon: 'shield' },
      { label: 'Audit Records', routerLink: '/legal-compliance/audit-records', icon: 'history' }
    ]
  },
  {
    label: 'Project Management',
    routerLink: '/project-management',
    icon: 'engineering',
    roles: ['SuperAdmin', 'ProjectManager'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/project-management', icon: 'dashboard' }
    ]
  },
  {
    label: 'Construction',
    routerLink: '/construction',
    icon: 'construction',
    roles: ['SuperAdmin', 'SiteManager', 'ProjectManager'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/construction', icon: 'dashboard' }
    ]
  },
  {
    label: 'Finance & Budget',
    routerLink: '/finance',
    icon: 'account_balance',
    roles: ['SuperAdmin', 'FinanceDirector'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/finance', icon: 'dashboard' }
    ]
  },
  {
    label: 'Property Units',
    routerLink: '/property-units',
    icon: 'apartment',
    roles: ['SuperAdmin', 'PropertyManager', 'SalesManager'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/property-units', icon: 'dashboard' }
    ]
  },
  {
    label: 'Sales & Marketing',
    routerLink: '/sales',
    icon: 'storefront',
    roles: ['SuperAdmin', 'SalesManager'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/sales', icon: 'dashboard' }
    ]
  },
  {
    label: 'Documents',
    routerLink: '/documents',
    icon: 'folder_open',
    roles: ['SuperAdmin'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/documents', icon: 'dashboard' }
    ]
  },
  {
    label: 'Reports',
    routerLink: '/reports',
    icon: 'analytics',
    roles: ['SuperAdmin', 'AcquisitionManager', 'LegalOfficer', 'FinanceDirector', 'ProjectManager'],
    enabled: true,
    section: 'placeholder',
    children: [
      { label: 'Dashboard', routerLink: '/reports', icon: 'dashboard' }
    ]
  }
];

/**
 * Administration navigation items — visible only to SuperAdmin.
 * Separated from main nav for the Administration section in the sidebar.
 */
export const ADMIN_NAV_ITEMS: readonly INavItem[] = [
  {
    label: 'Users',
    routerLink: '/admin/users',
    icon: 'people',
    roles: ['SuperAdmin'],
    enabled: true
  },
  {
    label: 'Roles',
    routerLink: '/admin/roles',
    icon: 'admin_panel_settings',
    roles: ['SuperAdmin'],
    enabled: true
  },
  {
    label: 'Permissions',
    routerLink: '/admin/permissions',
    icon: 'lock',
    roles: ['SuperAdmin'],
    enabled: true
  },
  {
    label: 'Audit Logs',
    routerLink: '/admin/audit-logs',
    icon: 'history',
    roles: ['SuperAdmin'],
    enabled: true
  },
  {
    label: 'Notifications',
    routerLink: '/admin/notification-rules',
    icon: 'notifications_active',
    roles: ['SuperAdmin'],
    enabled: true
  },
  {
    label: 'System Settings',
    routerLink: '/admin/settings',
    icon: 'settings',
    roles: ['SuperAdmin'],
    enabled: true
  }
];

/**
 * Filters navigation items based on the union of user's roles.
 *
 * Algorithm:
 * - If userRoles is empty → return only items with empty roles array (Dashboard)
 * - Otherwise → return items where at least one of the user's roles matches
 *   at least one of the item's allowed roles, OR the item has no role restriction
 *
 * This ensures no duplicates as each item appears at most once.
 *
 * @param items - The full list of navigation items
 * @param userRoles - The current user's assigned roles
 * @returns Filtered navigation items visible to the user
 */
export function getVisibleNavItems(
  items: readonly INavItem[],
  userRoles: readonly string[]
): INavItem[] {
  if (userRoles.length === 0) {
    // No roles → Dashboard only (items with empty roles array)
    return items.filter(item => item.roles.length === 0);
  }

  // Union: item is visible if it has no role restriction OR any user role matches any item role
  return items.filter(item =>
    item.roles.length === 0 ||
    item.roles.some(role => userRoles.includes(role))
  );
}
