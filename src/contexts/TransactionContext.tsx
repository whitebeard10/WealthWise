
'use client';

import type { Transaction } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    setError(null); 

    if (currentUser) {
      console.log('[TransactionContext] Current user for query:', currentUser.uid);
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(
        transactionsCollectionRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('[TransactionContext] Snapshot received. Docs count:', querySnapshot.size);
        const userTransactions: Transaction[] = [];
        if (querySnapshot.empty) {
          console.log('[TransactionContext] Query returned no documents for user:', currentUser.uid);
        }
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            if (querySnapshot.docs[0] === doc) { // Log only the first document's raw data
              console.log('[TransactionContext] Raw data of first doc:', { id: doc.id, ...data });
            }

            let formattedDate: string;
            if (typeof data.date === 'string') {
              try {
                // Try to parse it assuming it might be a full ISO string or yyyy-MM-dd
                // parseISO is robust for both
                formattedDate = format(parseISO(data.date), 'yyyy-MM-dd');
              } catch (e) {
                console.warn(`[TransactionContext] Could not parse date string "${data.date}" for doc ${doc.id}. Using as is.`, e);
                formattedDate = data.date; // Fallback to using as is if it's already in yyyy-MM-dd
              }
            } else if (data.date instanceof Timestamp) {
              formattedDate = format(data.date.toDate(), 'yyyy-MM-dd');
            } else {
              console.warn(`[TransactionContext] Unexpected date format for doc ${doc.id}:`, data.date, ". Defaulting to today.");
              formattedDate = format(new Date(), 'yyyy-MM-dd'); // Fallback
            }

            userTransactions.push({
              id: doc.id,
              description: data.description,
              amount: data.amount,
              type: data.type,
              date: formattedDate,
              category: data.category,
              userId: data.userId,
            } as Transaction);
          } catch (e) {
            console.error(`[TransactionContext] Error processing document ${doc.id}:`, e);
            setError(`Error processing transaction data. See console.`);
            // Potentially skip this doc or handle error more gracefully
          }
        });
        setTransactions(userTransactions);
        setLoading(false);
        if(userTransactions.length === 0 && !querySnapshot.empty) {
            // This case means docs were received but processing failed for all
            console.warn("[TransactionContext] Documents received but processing resulted in an empty transaction list.");
        } else {
            setError(null); // Clear error if snapshot is successful and transactions are processed
        }

      }, (err) => {
        console.error("[TransactionContext] Error fetching transactions from Firestore:", err);
        if (err.code === 'permission-denied') {
          setError("Permission denied. Please check Firestore security rules.");
          toast({title: "Firestore Error", description: "Permission denied. Check security rules.", variant: "destructive"});
        } else if (err.code === 'unimplemented' || (err.message && err.message.toLowerCase().includes('index'))) {
            setError("Firestore query requires an index. Check Firebase console for a link to create it.");
            toast({title: "Firestore Error", description: "Query requires an index. Check Firebase console.", variant: "destructive"});
        } else {
          setError("Could not load transactions from the database. See console for details.");
          toast({title: "Storage Error", description: "Could not load transactions. See console for details.", variant: "destructive"});
        }
        setTransactions([]);
        setLoading(false);
      });

      return () => {
        console.log('[TransactionContext] Unsubscribing from Firestore snapshot.');
        unsubscribe();
      };
    } else {
      console.log('[TransactionContext] No current user. Clearing transactions.');
      setTransactions([]);
      setLoading(false);
    }
  }, [currentUser, toast]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string }) => {
    if (!currentUser) {
      setError("You must be logged in to add a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to add a transaction.", variant: "destructive"});
      return;
    }
    setError(null);
    try {
      let dateString: string;
      if (typeof transactionData.date === 'string') {
        // If it's a string, try to parse and reformat to ensure yyyy-MM-dd
        // Handles if it's already yyyy-MM-dd or a full ISO string
        try {
          dateString = format(parseISO(transactionData.date), 'yyyy-MM-dd');
        } catch {
          // If parsing fails (e.g., it's already 'yyyy-MM-dd' but parseISO doesn't like it alone), use as is
          // This is a fallback, ideally input to addTransaction should be Date object or valid ISO string
          dateString = transactionData.date; 
          console.warn("[TransactionContext] addTransaction date string was not a full ISO string, using as is:", transactionData.date);
        }
      } else { // It's a Date object
        dateString = format(transactionData.date, 'yyyy-MM-dd');
      }

      const newTransaction = {
        ...transactionData,
        date: dateString, 
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'transactions'), newTransaction);
      toast({title: "Success", description: "Transaction added successfully!", variant: "default"});
    } catch (err: any) {
      console.error("[TransactionContext] Error adding transaction to Firestore:", err);
      setError(`Could not save the transaction: ${err.message}`);
      toast({ title: "Error", description: `Could not save the transaction: ${err.message}`, variant: "destructive"});
    }
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

    