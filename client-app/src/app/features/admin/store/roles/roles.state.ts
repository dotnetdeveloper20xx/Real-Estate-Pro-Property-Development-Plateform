import { EntityState } from '@ngrx/entity';
import { IRoleListItem, IRoleDetail, IPermissionMatrix } from '../../models/role.model';

/**
 * NgRx state interface for the admin roles feature slice.
 * Uses @ngrx/entity EntityState for normalized storage of role list items.
 */
export interface RolesState extends EntityState<IRoleListItem> {
  /** The currently selected role detail (loaded on detail view) */
  readonly selectedRole: IRoleDetail | null;
  /** The full permission matrix (roles × permissions) */
  readonly permissionMatrix: IPermissionMatrix | null;
  /** Whether a roles API call is in progress */
  readonly loading: boolean;
  /** The latest error message from a failed API call */
  readonly error: string | null;
}
