/**
 * Role list item DTO for the admin roles table.
 */
export interface IRoleListItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly userCount: number;
  readonly isBuiltIn: boolean;
}

/**
 * Detailed role DTO including assigned permissions.
 */
export interface IRoleDetail extends IRoleListItem {
  readonly permissions: readonly IPermissionItem[];
}

/**
 * Permission item DTO.
 */
export interface IPermissionItem {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly domainArea: string;
}

/**
 * A single cell in the permission matrix grid (role × permission).
 */
export interface IPermissionMatrixCell {
  readonly roleId: string;
  readonly permissionId: string;
  readonly isGranted: boolean;
}

/**
 * Full permission matrix DTO returned by the API.
 */
export interface IPermissionMatrix {
  readonly roles: readonly IRoleListItem[];
  readonly permissions: readonly IPermissionItem[];
  readonly assignments: readonly IPermissionMatrixCell[];
}

/**
 * Payload for creating a new role.
 */
export interface ICreateRoleRequest {
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
}

/**
 * Payload for updating an existing role.
 */
export interface IUpdateRoleRequest {
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
}

/**
 * Payload for toggling a permission assignment on a role.
 */
export interface ITogglePermissionRequest {
  readonly roleId: string;
  readonly permissionId: string;
  readonly isGranted: boolean;
}
