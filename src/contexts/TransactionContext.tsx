
'use client';

import type { Transaction } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    setLoading(true);
    if (currentUser) {
      setError(null);
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(
        transactionsCollectionRef, 
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc') // Optional: order by date
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to string if necessary, or handle date object
          // For now, assuming 'date' is stored as a string in 'yyyy-MM-dd' format as before.
          // If 'date' is a Firestore Timestamp, you'll need to convert:
          // date: (data.date as Timestamp).toDate().toISOString().split('T')[0], 
          userTransactions.push({ 
            id: doc.id, 
            ...data,
            // Ensure date is handled correctly if it's a Firestore Timestamp
             date: typeof data.date === 'string' ? data.date : format((data.date as Timestamp).toDate(), 'yyyy-MM-dd'),
          } as Transaction);
        });
        setTransactions(userTransactions);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching transactions from Firestore:", err);
        setError("Could not load transactions from the database.");
        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener on component unmount or user change
    } else {
      // No user logged in, clear transactions and stop loading
      setTransactions([]);
      setLoading(false);
    }
  }, [currentUser]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    if (!currentUser) {
      setError("You must be logged in to add a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to add a transaction.", variant: "destructive"});
      return;
    }
    setError(null);
    try {
      const newTransaction = {
        ...transactionData,
        userId: currentUser.uid,
        // date is already a string 'yyyy-MM-dd' from TransactionForm
      };
      // Firestore will auto-generate an ID for the document
      await addDoc(collection(db, 'transactions'), newTransaction);
      // The onSnapshot listener will automatically update the local state
    } catch (err) {
      console.error("Error adding transaction to Firestore:", err);
      setError("Could not save the transaction.");
      // Consider using toast here for user feedback
      // toast({ title: "Error", description: "Could not save the transaction.", variant: "destructive"});
    }
  };
  
  // Temporary toast function to avoid breaking if useToast isn't available here
  // Ideally, useToast would be part of a shared utility or passed down
  const toast = (options: {title: string, description: string, variant: "default" | "destructive"}) => {
    console.log(`Toast: ${options.title} - ${options.description} (${options.variant})`);
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
