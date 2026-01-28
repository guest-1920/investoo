import { SetMetadata } from '@nestjs/common';
import { Role } from '../../common/enums/roles.enum';

export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 * Usage: @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
