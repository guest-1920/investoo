import 'reflect-metadata';
import { GridRegistry } from './../grid.registry';

export const GRID_SCHEMA_KEY = Symbol('GRID_SCHEMA');

/**
 * @GridSchema decorator - Register an entity class for grid schema generation
 * Use on entity classes to enable grid/table schema extraction
 *
 * @example
 * @GridSchema('users')
 * @Entity('users')
 * export class User extends AuditedEntity { ... }
 */
export function GridSchema(name: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(GRID_SCHEMA_KEY, name, target);
    GridRegistry.register(name, target);
  };
}
