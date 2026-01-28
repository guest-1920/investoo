import { ValueTransformer } from 'typeorm';

/**
 * Transformer for PostgreSQL numeric/decimal columns
 * Ensures proper conversion between string (DB) and number (JS)
 */
export const DecimalTransformer: ValueTransformer = {
  to: (value: number | null): number | null => {
    return value;
  },
  from: (value: string | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return parseFloat(value);
  },
};

/**
 * Transformer for integer-based decimal storage (e.g., storing cents/paise)
 * Multiplies by 100 when storing, divides by 100 when reading
 */
export const IntegerDecimalTransformer: ValueTransformer = {
  to: (value: number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return Math.round(value * 100);
  },
  from: (value: number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return value / 100;
  },
};
