import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import './TypeaheadInput.css';

interface TypeaheadInputProps {
    endpoint: string;
    displayField: string;
    valueField: string;
    value: string | number;
    onChange: (value: string | number) => void;
    placeholder?: string;
    disabled?: boolean;
    initialObject?: any;
    label?: string;
}

export function TypeaheadInput({
    endpoint,
    displayField,
    valueField,
    value,
    onChange,
    placeholder,
    disabled,
    initialObject,
}: TypeaheadInputProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initialize with existing value
    useEffect(() => {
        if (initialObject && initialObject[valueField] === value) {
            setSelectedLabel(initialObject[displayField]);
            setSearchTerm(initialObject[displayField]);
        } else if (value && !selectedLabel) {
            // Fetch to resolve the initial value's label
            resolveInitialValue();
        }
    }, [value, initialObject]);

    const resolveInitialValue = async () => {
        try {
            const response = await api.get(endpoint, { params: { limit: 50 } });
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                const match = data.find((item: any) => item[valueField] === value);
                if (match) {
                    setSelectedLabel(match[displayField]);
                    setSearchTerm(match[displayField]);
                }
            }
        } catch (error) {
            console.error('Failed to resolve initial value', error);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (selectedLabel) {
                    setSearchTerm(selectedLabel);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedLabel]);

    const fetchOptions = useCallback(async (search: string) => {
        // Require at least 2 characters before searching
        if (!search.trim() || search.trim().length < 2) {
            setOptions([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const response = await api.get(endpoint, {
                params: { limit: 20, search: search.trim() }
            });
            const data = response.data.data || response.data;
            setOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Typeahead fetch failed', error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        setIsOpen(true);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchOptions(newValue);
        }, 300);
    };

    const handleFocus = () => {
        // Only open dropdown if we already have search results
        if (options.length > 0 || hasSearched) {
            setIsOpen(true);
        }
    };

    const handleSelect = (option: any) => {
        onChange(option[valueField]);
        setSearchTerm(option[displayField]);
        setSelectedLabel(option[displayField]);
        setIsOpen(false);
        setHasSearched(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
        setSelectedLabel('');
        setOptions([]);
        setHasSearched(false);
    };

    const showDropdown = isOpen && (loading || hasSearched);

    return (
        <div className="typeahead-wrapper" ref={wrapperRef}>
            <div className="typeahead-input-container">
                <input
                    type="text"
                    className="form-input"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    placeholder={placeholder || 'Type to search...'}
                    disabled={disabled}
                    autoComplete="off"
                />
                {loading && <span className="typeahead-spinner" />}
                {!loading && selectedLabel && (
                    <button
                        type="button"
                        className="typeahead-clear"
                        onClick={handleClear}
                        title="Clear selection"
                    >
                        ×
                    </button>
                )}
            </div>

            {showDropdown && (
                <ul className="typeahead-dropdown">
                    {loading && (
                        <li className="typeahead-message">Searching...</li>
                    )}
                    {!loading && options.length === 0 && hasSearched && (
                        <li className="typeahead-message">No results found</li>
                    )}
                    {!loading && options.map((option: any) => (
                        <li
                            key={option[valueField]}
                            onClick={() => handleSelect(option)}
                            className={`typeahead-option ${option[valueField] === value ? 'selected' : ''}`}
                        >
                            <span className="option-name">{option[displayField]}</span>
                            {option.description && (
                                <span className="option-description">{option.description}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TypeaheadInput;
