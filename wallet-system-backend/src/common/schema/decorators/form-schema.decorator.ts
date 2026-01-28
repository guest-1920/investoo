import 'reflect-metadata';

export const FORM_SCHEMA_KEY = Symbol('FORM_SCHEMA');

/**
 * @FormSchema decorator - Registers a DTO class for schema generation
 * @param name Unique schema name (e.g., 'register', 'create-plan')
 */
export function FormSchema(name: string): ClassDecorator {
  return (target: Function) => {
    Reflect.defineMetadata(FORM_SCHEMA_KEY, name, target);
    // Register in global schema registry
    const { SchemaRegistry } = require('../schema.registry');
    SchemaRegistry.register(name, target);
  };
}
