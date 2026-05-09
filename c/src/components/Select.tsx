// src/components/Select.tsx (FIXED - with OptionType export)
import React from 'react';
import ReactSelect from 'react-select';
import type { Props as SelectProps } from 'react-select';

export interface OptionType {
    value: string;
    label: string;
}

interface CustomSelectProps extends SelectProps<OptionType, false> {
    error?: string;
    label?: string;
    required?: boolean;
}

const Select = ({ error, label, required, ...props }: CustomSelectProps) => {
    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            borderColor: error ? '#ef4444' : state.isFocused ? '#FF3333' : 'rgba(255, 255, 255, 0.1)',
            borderWidth: '1px',
            borderRadius: '0.75rem',
            padding: '0.25rem 0',
            boxShadow: state.isFocused ? '0 0 0 1px #FF3333' : 'none',
            '&:hover': {
                borderColor: error ? '#ef4444' : '#FF3333'
            }
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: 'rgba(156, 163, 175, 0.8)'
        }),
        input: (provided: any) => ({
            ...provided,
            color: 'white'
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: 'white'
        }),
        menu: (provided: any) => ({
            ...provided,
            backgroundColor: '#1A1A1A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0.75rem',
            overflow: 'hidden'
        }),
        menuList: (provided: any) => ({
            ...provided,
            '&::-webkit-scrollbar': {
                width: '8px'
            },
            '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px'
            }
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isFocused ? 'rgba(255, 51, 51, 0.1)' : 'transparent',
            color: state.isSelected ? '#FF3333' : 'white',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: 'rgba(255, 51, 51, 0.2)'
            }
        }),
        dropdownIndicator: (provided: any) => ({
            ...provided,
            color: 'rgba(156, 163, 175, 0.8)',
            '&:hover': {
                color: '#FF3333'
            }
        }),
        indicatorSeparator: (provided: any) => ({
            ...provided,
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }),
        clearIndicator: (provided: any) => ({
            ...provided,
            color: 'rgba(156, 163, 175, 0.8)',
            '&:hover': {
                color: '#ef4444'
            }
        })
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-white font-medium">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            <ReactSelect {...props} styles={customStyles} />
            {error && (
                <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
        </div>
    );
};

export default Select;

export { OptionType };