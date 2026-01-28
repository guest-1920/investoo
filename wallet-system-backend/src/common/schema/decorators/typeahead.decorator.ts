import 'reflect-metadata';

export const TYPEAHEAD_KEY = Symbol('TYPEAHEAD');

export interface TypeaheadOptions {
  /** API endpoint for search (e.g., '/api/v1/plans/search') */
  endpoint: string;
  /** Field to display to user (e.g., 'name') */
  displayField: string;
  /** Field to store as value (e.g., 'id') */
  valueField: string;
  /** Optional: minimum characters before search */
  minChars?: number;
  /** Optional: debounce delay in ms */
  debounce?: number;
  /** Display label for the field */
  label?: string;
}

/**
 * @Typeahead decorator - Mark a field as a typeahead/autocomplete reference field
 * Used for UUID fields that reference other entities
 */
export function Typeahead(options: TypeaheadOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingTypeaheads =
      Reflect.getMetadata(TYPEAHEAD_KEY, target.constructor) || {};
    existingTypeaheads[propertyKey] = options;
    Reflect.defineMetadata(
      TYPEAHEAD_KEY,
      existingTypeaheads,
      target.constructor,
    );
  };
}
