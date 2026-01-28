import 'reflect-metadata';

export const FIELD_CONFIG_KEY = Symbol('FIELD_CONFIG');

export interface FieldOptions {
  /** Override auto-detected type */
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'select'
    | 'checkbox'
    | 'date'
    | 'textarea'
    | 'hidden';
  /** Display label for the field */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Hide field from form (still in DTO) */
  hidden?: boolean;
  /** Override required detection */
  required?: boolean;
  /** Order in form (lower = first) */
  order?: number;

  // ============ Grid-specific options ============
  /** Enable sorting on this column */
  sortable?: boolean;
  /** Enable filtering on this column */
  filterable?: boolean;
  /** Column width (number for px, string for %, auto, etc.) */
  width?: number | string;
  /** Text alignment in column */
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'date' | 'datetime' | 'boolean' | 'badge';
}

/**
 * @Field decorator - Add custom configuration to a DTO property
 * Use for hidden fields, custom labels, or overriding auto-detection
 */
export function Field(options: FieldOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingFields =
      Reflect.getMetadata(FIELD_CONFIG_KEY, target.constructor) || {};
    existingFields[propertyKey] = options;
    Reflect.defineMetadata(
      FIELD_CONFIG_KEY,
      existingFields,
      target.constructor,
    );
  };
}
