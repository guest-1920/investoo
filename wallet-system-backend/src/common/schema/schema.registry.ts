/**
 * Global registry to store all DTO classes decorated with @FormSchema
 */
class SchemaRegistryClass {
  private schemas = new Map<string, Function>();

  /**
   * Register a DTO class with a schema name
   */
  register(name: string, target: Function): void {
    if (this.schemas.has(name)) {
      throw new Error(`Schema "${name}" is already registered`);
    }
    this.schemas.set(name, target);
  }

  /**
   * Get a DTO class by schema name
   */
  get(name: string): Function | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all registered schema names
   */
  getAll(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * Get all registered schemas with their classes
   */
  getAllWithClasses(): Map<string, Function> {
    return new Map(this.schemas);
  }

  /**
   * Check if a schema is registered
   */
  has(name: string): boolean {
    return this.schemas.has(name);
  }
}

export const SchemaRegistry = new SchemaRegistryClass();
