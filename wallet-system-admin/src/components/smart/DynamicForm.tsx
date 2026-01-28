import React, { useState, useEffect } from 'react';
import type { FieldSchema } from '../../services';
import { TypeaheadInput } from './TypeaheadInput';
import './DynamicForm.css';

export interface DynamicFormProps {
    fields: FieldSchema[];
    initialValues?: Record<string, unknown>;
    onSubmit: (values: Record<string, unknown>) => void;
    onCancel?: () => void;
    submitLabel?: string;
    loading?: boolean;
}

export function DynamicForm({
    fields,
    initialValues = {},
    onSubmit,
    onCancel,
    submitLabel = 'Submit',
    loading = false,
}: DynamicFormProps) {
    const [values, setValues] = useState<Record<string, unknown>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setValues(initialValues);
    }, [initialValues]);

    const handleChange = (name: string, value: unknown) => {
        setValues(prev => ({ ...prev, [name]: value }));
        // Clear error when field changes
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        for (const field of fields) {
            if (field.hidden) continue;

            const value = values[field.name];

            // Required validation
            if (field.required && (value === undefined || value === null || value === '')) {
                newErrors[field.name] = `${field.label} is required`;
                continue;
            }

            // Skip other validations if empty and not required
            if (value === undefined || value === null || value === '') continue;

            // Min length
            if (field.validation.minLength && String(value).length < field.validation.minLength) {
                newErrors[field.name] = `${field.label} must be at least ${field.validation.minLength} characters`;
            }

            // Max length
            if (field.validation.maxLength && String(value).length > field.validation.maxLength) {
                newErrors[field.name] = `${field.label} must be at most ${field.validation.maxLength} characters`;
            }

            // Min value
            if (field.validation.min !== undefined && Number(value) < field.validation.min) {
                newErrors[field.name] = `${field.label} must be at least ${field.validation.min}`;
            }

            // Max value
            if (field.validation.max !== undefined && Number(value) > field.validation.max) {
                newErrors[field.name] = `${field.label} must be at most ${field.validation.max}`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            // Filter values to only include fields defined in the schema
            const fieldNames = new Set(fields.map(f => f.name));
            const filteredValues = Object.fromEntries(
                Object.entries(values).filter(([key]) => fieldNames.has(key))
            );
            onSubmit(filteredValues);
        }
    };

    const renderField = (field: FieldSchema) => {
        if (field.hidden) return null;

        const value = values[field.name] ?? '';
        const error = errors[field.name];

        switch (field.type) {
            case 'typeahead':
            case 'select':
            case 'select-legacy':
                if (field.typeahead) {
                    // Heuristic: if field is 'rewardId', look for 'reward' object in initialValues
                    const relationName = field.name.endsWith('Id') ? field.name.slice(0, -2) : '';
                    const initialObject = relationName ? initialValues[relationName] : undefined;

                    return (
                        <TypeaheadInput
                            endpoint={field.typeahead.endpoint}
                            displayField={field.typeahead.displayField}
                            valueField={field.typeahead.valueField}
                            value={String(value || '')}
                            onChange={(newValue) => handleChange(field.name, newValue)}
                            placeholder={field.placeholder || `Search ${field.label}...`}
                            disabled={loading}
                            initialObject={initialObject}
                            label={field.typeahead.label}
                        />
                    );
                }

                // Normal select fallback
                return (
                    <select
                        id={field.name}
                        className={`form-input form-select ${error ? 'error' : ''}`}
                        value={String(value)}
                        onChange={e => handleChange(field.name, e.target.value)}
                        disabled={loading}
                    >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            id={field.name}
                            checked={Boolean(value)}
                            onChange={e => handleChange(field.name, e.target.checked)}
                            disabled={loading}
                        />
                        <span>{field.label}</span>
                    </label>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        id={field.name}
                        className={`form-input ${error ? 'error' : ''}`}
                        value={value as number | ''}
                        onChange={e => handleChange(field.name, e.target.value ? Number(e.target.value) : '')}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        min={field.validation.min}
                        max={field.validation.max}
                        step="any"
                        disabled={loading}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        id={field.name}
                        className={`form-input ${error ? 'error' : ''}`}
                        value={String(value).split('T')[0] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        disabled={loading}
                    />
                );

            case 'email':
                return (
                    <input
                        type="email"
                        id={field.name}
                        className={`form-input ${error ? 'error' : ''}`}
                        value={String(value)}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        disabled={loading}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        id={field.name}
                        className={`form-input form-textarea ${error ? 'error' : ''}`}
                        value={String(value)}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        disabled={loading}
                        rows={4}
                    />
                );

            default:
                return (
                    <input
                        type="text"
                        id={field.name}
                        className={`form-input ${error ? 'error' : ''}`}
                        value={String(value)}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        minLength={field.validation.minLength}
                        maxLength={field.validation.maxLength}
                        disabled={loading}
                    />
                );
        }
    };

    const visibleFields = fields
        .filter(f => !f.hidden)
        .sort((a, b) => a.order - b.order);

    return (
        <form onSubmit={handleSubmit} className="dynamic-form">
            {visibleFields.map(field => (
                <div key={field.name} className="form-group">
                    {field.type !== 'checkbox' && (
                        <label className="form-label" htmlFor={field.name}>
                            {field.label}
                            {field.required && <span className="required-mark">*</span>}
                        </label>
                    )}
                    {renderField(field)}
                    {errors[field.name] && (
                        <span className="form-error">{errors[field.name]}</span>
                    )}
                </div>
            ))}

            <div className="form-actions">
                {onCancel && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Saving...
                        </>
                    ) : (
                        submitLabel
                    )}
                </button>
            </div>
        </form>
    );
}

export default DynamicForm;
