import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    rate: number;
}

export const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.0 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.0 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88 }
];

interface CurrencyContextType {
    selectedCurrency: string;
    setSelectedCurrency: (code: string) => void;
    formatCurrency: (amount: number, originalCurrency?: string) => string;
    convertCurrency: (amount: number, fromCurrency?: string) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [selectedCurrency, setSelectedCurrencyState] = useState<string>(() => {
        try {
            return localStorage.getItem('opside.currency') || 'USD';
        } catch {
            return 'USD';
        }
    });

    const setSelectedCurrency = useCallback((code: string) => {
        setSelectedCurrencyState(code);
        try {
            localStorage.setItem('opside.currency', code);
        } catch { }
    }, []);

    const convertCurrency = useCallback((amount: number, fromCurrency: string = 'USD') => {
        const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
        return (amount / fromRate) * toRate;
    }, [selectedCurrency]);

    const formatCurrency = useCallback((amount: number, originalCurrency: string = 'USD') => {
        const convertedAmount = convertCurrency(amount, originalCurrency);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency,
            currencyDisplay: 'symbol'
        }).format(convertedAmount);
    }, [selectedCurrency, convertCurrency]);

    return (
        <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatCurrency, convertCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
