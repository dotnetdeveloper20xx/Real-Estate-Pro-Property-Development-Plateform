/**
 * Application navigation item definition.
 * Used by the sidebar/menu component to render links.
 */
export interface INavItem {
  /** Display label for the navigation link */
  readonly label: string;
  /** Router link path */
  readonly routerLink: string;
  /** Material icon name */
  readonly icon: string;
  /** Roles that can see this navigation item (empty = all authenticated) */
  readonly roles: readonly string[];
  /** Whether this module is active/enabled */
  readonly enabled: boolean;
}

/**
 * Main sidebar navigation items for BuildEstate Pro.
 *
 * Each item maps to a lazy-loaded feature module.
 * The sidebar component should filter by user roles.
 */
export const NAV_ITEMS: readonly INavItem[] = [
  {
    label: 'Land Acquisition',
    routerLink: '/land-acquisition',
    icon: 'terrain',
    roles: ['Acquisition_Manager', 'Admin_Support', 'Finance_Director'],
    enabled: true
  },
  {
    label: 'Planning & Approvals',
    routerLink: '/planning-approvals',
    icon: 'assignment',
    roles: ['Planning_Manager', 'Admin_Support', 'Legal_Compliance_Officer', 'Finance_Director'],
    enabled: true
  }
];
