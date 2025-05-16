'use client';

import type { Transaction } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id'>) => void;
  loading: boolean;
  error: string | null;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'wealthwise_transactions';

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
    } catch (err) {
      console.error("Failed to load transactions from localStorage", err);
      setError("Could not load saved transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) { // Only save when not initially loading
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
      } catch (err) {
        console.error("Failed to save transactions to localStorage", err);
        setError("Could not save transactions. Your data might not persist.");
      }
    }
  }, [transactions, loading]);

  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: new Date().toISOString() + Math.random().toString(36).substring(2, 9), // Simple unique ID
    };
    setTransactions(prevTransactions => [...prevTransactions, newTransaction]);
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, loading, error }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
