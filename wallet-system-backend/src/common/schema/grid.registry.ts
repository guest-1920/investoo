/**
 * Global registry to store all Entity classes decorated with @GridSchema
 */
class GridRegistryClass {
  private schemas = new Map<string, Function>();

  /**
   * Register an entity class with a schema name
   */
  register(name: string, target: Function): void {
    if (this.schemas.has(name)) {
      throw new Error(`Grid schema "${name}" is already registered`);
    }
    this.schemas.set(name, target);
  }

  /**
   * Get an entity class by schema name
   */
  get(name: string): Function | undefined {
    return this.schemas.get(name);
  }

  /**
   * Get all registered grid schema names
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
   * Check if a grid schema is registered
   */
  has(name: string): boolean {
    return this.schemas.has(name);
  }
}

export const GridRegistry = new GridRegistryClass();
