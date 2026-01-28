import { Injectable } from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import 'reflect-metadata';
import { SchemaRegistry } from './schema.registry';
import { GridRegistry } from './grid.registry';
import { FIELD_CONFIG_KEY, TYPEAHEAD_KEY } from './decorators';
import type { FieldOptions, TypeaheadOptions } from './decorators';

export interface FieldSchema {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  hidden: boolean;
  order: number;
  validation: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  typeahead?: TypeaheadOptions;
  options?: { label: string; value: string | number }[];
}

export interface FormSchemaResponse {
  name: string;
  fields: FieldSchema[];
}

export interface GridColumnSchema {
  name: string;
  type: string;
  label: string;
  hidden: boolean;
  order: number;
  sortable: boolean;
  filterable: boolean;
  width?: number | string;
  align: 'left' | 'center' | 'right';
  format?: 'currency' | 'date' | 'datetime' | 'boolean' | 'badge';
  options?: { label: string; value: string | number }[];
  typeahead?: TypeaheadOptions;
}

export interface GridSchemaResponse {
  name: string;
  columns: GridColumnSchema[];
}

@Injectable()
export class SchemaService {
  /**
   * Get all registered schema names
   */
  getAllSchemaNames(): string[] {
    return SchemaRegistry.getAll();
  }

  /**
   * Get all registered grid schema names
   */
  getAllGridSchemaNames(): string[] {
    return GridRegistry.getAll();
  }

  /**
   * Get schema for a specific DTO by name
   */
  getSchema(name: string): FormSchemaResponse | null {
    const dtoClass = SchemaRegistry.get(name);
    if (!dtoClass) {
      return null;
    }

    const fields = this.extractFields(dtoClass);
    return {
      name,
      fields: fields.sort((a, b) => a.order - b.order),
    };
  }

  /**
   * Get grid schema for a specific entity by name
   */
  getGridSchema(name: string): GridSchemaResponse | null {
    const entityClass = GridRegistry.get(name);
    if (!entityClass) {
      return null;
    }

    const columns = this.extractColumns(entityClass);
    return {
      name,
      columns: columns
        .filter((c) => !c.hidden)
        .sort((a, b) => a.order - b.order),
    };
  }

  /**
   * Extract field metadata from a DTO class
   */
  private extractFields(dtoClass: Function): FieldSchema[] {
    const fields: FieldSchema[] = [];
    const metadataStorage = getMetadataStorage();

    // Get all validation metadata for this class
    const validationMetadata = metadataStorage.getTargetValidationMetadatas(
      dtoClass,
      '',
      false,
      false,
    );

    // Get custom field configs
    const fieldConfigs: Record<string, FieldOptions> =
      Reflect.getMetadata(FIELD_CONFIG_KEY, dtoClass) || {};

    // Get typeahead configs
    const typeaheadConfigs: Record<string, TypeaheadOptions> =
      Reflect.getMetadata(TYPEAHEAD_KEY, dtoClass) || {};

    // Group metadata by property
    const propertyMetadata = new Map<string, any[]>();
    for (const meta of validationMetadata) {
      const existing = propertyMetadata.get(meta.propertyName) || [];
      existing.push(meta);
      propertyMetadata.set(meta.propertyName, existing);
    }

    // Process each property
    let orderCounter = 0;
    for (const [propertyName, metadata] of propertyMetadata) {
      const fieldConfig = fieldConfigs[propertyName] || {};
      const typeaheadConfig = typeaheadConfigs[propertyName];

      const field: FieldSchema = {
        name: propertyName,
        type: this.detectType(metadata, fieldConfig, typeaheadConfig),
        label: fieldConfig.label || this.toLabel(propertyName),
        placeholder: fieldConfig.placeholder,
        required: this.isRequired(metadata, fieldConfig),
        hidden: fieldConfig.hidden || false,
        order: fieldConfig.order ?? orderCounter++,
        validation: this.extractValidation(metadata),
      };

      // Add typeahead config if present
      if (typeaheadConfig) {
        field.typeahead = typeaheadConfig;
      }

      // Add enum options if it's a select
      const enumMeta = metadata.find((m) => m.name === 'isEnum');
      if (enumMeta && enumMeta.constraints?.[0]) {
        field.options = this.extractEnumOptions(enumMeta.constraints[0]);
      }

      fields.push(field);
    }

    return fields;
  }

  /**
   * Detect field type from class-validator decorators
   * Uses the 'name' property from validation metadata
   */
  private detectType(
    metadata: any[],
    fieldConfig: FieldOptions,
    typeaheadConfig?: TypeaheadOptions,
  ): string {
    // Custom type takes priority
    if (fieldConfig.type) return fieldConfig.type;
    if (typeaheadConfig) return 'typeahead';

    // Detect from class-validator decorator names
    for (const meta of metadata) {
      switch (meta.name) {
        case 'isEmail':
          return 'email';
        case 'isNumber':
        case 'isInt':
          return 'number';
        case 'isBoolean':
          return 'checkbox';
        case 'isDate':
        case 'isDateString':
          return 'date';
        case 'isEnum':
          return 'select';
        case 'isUUID':
          return 'text';
      }
    }

    return 'text';
  }

  /**
   * Check if field is required
   */
  private isRequired(metadata: any[], fieldConfig: FieldOptions): boolean {
    if (fieldConfig.required !== undefined) return fieldConfig.required;

    // If @IsOptional is present, it's not required
    const hasOptional = metadata.some((m) => m.name === 'isOptional');
    return !hasOptional;
  }

  /**
   * Extract validation rules from metadata
   */
  private extractValidation(metadata: any[]): FieldSchema['validation'] {
    const validation: FieldSchema['validation'] = {};

    for (const meta of metadata) {
      switch (meta.name) {
        case 'minLength':
          validation.minLength = meta.constraints?.[0];
          break;
        case 'maxLength':
          validation.maxLength = meta.constraints?.[0];
          break;
        case 'min':
          validation.min = meta.constraints?.[0];
          break;
        case 'max':
          validation.max = meta.constraints?.[0];
          break;
        case 'matches':
          validation.pattern = meta.constraints?.[0]?.toString();
          break;
      }
    }

    return validation;
  }

  /**
   * Extract options from enum
   */
  private extractEnumOptions(
    enumObj: object,
  ): { label: string; value: string | number }[] {
    return Object.entries(enumObj)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        label: this.toLabel(key),
        value: value as string | number,
      }));
  }

  /**
   * Convert camelCase/PascalCase to readable label
   */
  private toLabel(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  /**
   * Extract column metadata from an Entity class for grid schema
   * Uses @Field decorators on entity properties
   */
  private extractColumns(entityClass: Function): GridColumnSchema[] {
    const columns: GridColumnSchema[] = [];

    // Get custom field configs from @Field decorators
    const fieldConfigs: Record<string, FieldOptions> =
      this.getInheritedFieldConfigs(entityClass);

    // Get typeahead configs from @Typeahead decorators
    const typeaheadConfigs: Record<string, TypeaheadOptions> =
      this.getInheritedTypeaheadConfigs(entityClass);

    // Get TypeORM column metadata if available
    const typeormColumns = this.getTypeOrmColumnNames(entityClass);

    // Process each field config or typeorm column
    const allProperties = new Set([
      ...Object.keys(fieldConfigs),
      ...Object.keys(typeaheadConfigs),
      ...typeormColumns,
    ]);

    let orderCounter = 0;
    for (const propertyName of allProperties) {
      const fieldConfig = fieldConfigs[propertyName] || {};
      const typeaheadConfig = typeaheadConfigs[propertyName];

      const column: GridColumnSchema = {
        name: propertyName,
        type: typeaheadConfig
          ? 'typeahead'
          : this.detectGridColumnType(propertyName, fieldConfig),
        label:
          fieldConfig.label ||
          typeaheadConfig?.label ||
          this.toLabel(propertyName),
        hidden: fieldConfig.hidden || false,
        order: fieldConfig.order ?? orderCounter++,
        sortable: fieldConfig.sortable ?? true,
        filterable: fieldConfig.filterable ?? true,
        align:
          fieldConfig.align || this.detectAlignment(propertyName, fieldConfig),
      };

      // Add optional properties
      if (fieldConfig.width !== undefined) {
        column.width = fieldConfig.width;
      }
      if (fieldConfig.format !== undefined) {
        column.format = fieldConfig.format;
      }
      if (typeaheadConfig) {
        column.typeahead = typeaheadConfig;
      }

      columns.push(column);
    }

    return columns;
  }

  /**
   * Get inherited field configs from class and its parent classes
   */
  private getInheritedFieldConfigs(
    entityClass: Function,
  ): Record<string, FieldOptions> {
    const configs: Record<string, FieldOptions> = {};

    // Walk up the prototype chain
    let currentClass = entityClass;
    while (currentClass && currentClass.name) {
      const classConfigs =
        Reflect.getMetadata(FIELD_CONFIG_KEY, currentClass) || {};
      // Parent configs don't override child configs
      for (const [key, value] of Object.entries(classConfigs)) {
        if (!configs[key]) {
          configs[key] = value as FieldOptions;
        }
      }
      currentClass = Object.getPrototypeOf(currentClass);
    }

    return configs;
  }

  /**
   * Get inherited typeahead configs from class and its parent classes
   */
  private getInheritedTypeaheadConfigs(
    entityClass: Function,
  ): Record<string, TypeaheadOptions> {
    const configs: Record<string, TypeaheadOptions> = {};

    // Walk up the prototype chain
    let currentClass = entityClass;
    while (currentClass && currentClass.name) {
      const classConfigs =
        Reflect.getMetadata(TYPEAHEAD_KEY, currentClass) || {};
      // Parent configs don't override child configs
      for (const [key, value] of Object.entries(classConfigs)) {
        if (!configs[key]) {
          configs[key] = value as TypeaheadOptions;
        }
      }
      currentClass = Object.getPrototypeOf(currentClass);
    }

    return configs;
  }

  /**
   * Get TypeORM column names from entity metadata
   */
  private getTypeOrmColumnNames(entityClass: Function): string[] {
    // Try to get TypeORM metadata if available
    try {
      const columns =
        Reflect.getMetadata('typeorm:columns', entityClass.prototype) || [];
      return columns.map((col: any) => col.propertyName);
    } catch {
      return [];
    }
  }

  /**
   * Detect grid column type based on property name and config
   */
  private detectGridColumnType(
    propertyName: string,
    fieldConfig: FieldOptions,
  ): string {
    if (fieldConfig.type) return fieldConfig.type;

    // Infer from common naming patterns
    if (propertyName.endsWith('At') || propertyName.includes('Date'))
      return 'date';
    if (propertyName.endsWith('Id')) return 'text';
    if (propertyName === 'email') return 'email';
    if (
      propertyName === 'price' ||
      propertyName === 'amount' ||
      propertyName.includes('Balance')
    )
      return 'number';
    if (propertyName === 'status' || propertyName === 'role') return 'select';
    if (propertyName === 'deleted' || propertyName.startsWith('is'))
      return 'checkbox';

    return 'text';
  }

  /**
   * Detect column alignment based on type
   */
  private detectAlignment(
    propertyName: string,
    fieldConfig: FieldOptions,
  ): 'left' | 'center' | 'right' {
    const type = this.detectGridColumnType(propertyName, fieldConfig);

    if (type === 'number') return 'right';
    if (type === 'checkbox' || type === 'date') return 'center';

    return 'left';
  }
}
