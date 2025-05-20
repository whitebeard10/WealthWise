
'use client';

import type { Transaction } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/client';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  FirestoreError,
} from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string }) => Promise<void>;
  updateTransaction: (id: string, transactionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
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
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (currentUser) {
      console.log('[TransactionContext] Setting up snapshot. Current user for query:', currentUser.uid);
      const transactionsCollectionRef = collection(db, 'transactions');
      const q = query(
        transactionsCollectionRef,
        where('userId', '==', currentUser.uid),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log(`[TransactionContext] Snapshot received. querySnapshot.empty: ${querySnapshot.empty}, Docs count: ${querySnapshot.size}`);
        const userTransactions: Transaction[] = [];

        if (querySnapshot.empty) {
          console.log('[TransactionContext] Query returned no documents for user:', currentUser.uid);
        } else {
          console.log('[TransactionContext] Processing documents...');
        }

        querySnapshot.forEach((doc) => {
          console.log(`[TransactionContext] Attempting to process doc ${doc.id}`);
          try {
            const data = doc.data();
             if (querySnapshot.docs[0] === doc) {
              console.log('[TransactionContext] Raw data of first doc:', { id: doc.id, ...data });
            }

            let formattedDate: string;
            if (typeof data.date === 'string') {
              try {
                // Ensure date is in yyyy-MM-dd format, parseISO expects more complete ISO string
                const parsedDate = parseISO(data.date.includes('T') ? data.date : `${data.date}T00:00:00`);
                if (isValid(parsedDate)) {
                  formattedDate = format(parsedDate, 'yyyy-MM-dd');
                } else {
                  throw new Error('Invalid date string after attempting to make it ISO compatible');
                }
              } catch (e) {
                console.warn(`[TransactionContext] Could not parse date string "${data.date}" for doc ${doc.id}. Using as is or defaulting. Error: ${e}`, e);
                // Attempt to parse as yyyy-MM-dd, if fails, default.
                const parts = data.date.split('-');
                if(parts.length === 3 && parts.every((p:string) => !isNaN(parseInt(p)))) {
                    formattedDate = data.date; // Assume it's already yyyy-MM-dd
                } else {
                    formattedDate = format(new Date(), 'yyyy-MM-dd'); // Fallback
                }
              }
            } else if (data.date instanceof Timestamp) {
              formattedDate = format(data.date.toDate(), 'yyyy-MM-dd');
            } else {
              console.warn(`[TransactionContext] Unexpected date format for doc ${doc.id}:`, data.date, ". Defaulting to today.");
              formattedDate = format(new Date(), 'yyyy-MM-dd');
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
            setError(`Error processing transaction data for doc ${doc.id}. See console.`);
          }
        });

        console.log('[TransactionContext] Processed documents. Resulting userTransactions:', JSON.stringify(userTransactions, null, 2));


        if (userTransactions.length === 0 && !querySnapshot.empty) {
          console.warn("[TransactionContext] querySnapshot was not empty, but userTransactions list is. This suggests an issue processing all documents or a filter mismatch not caught by rules.");
        }

        setTransactions(userTransactions);
        setLoading(false);
        setError(null);

      }, (err: FirestoreError) => {
        console.error("[TransactionContext] Error fetching transactions from Firestore:", err.code, err.message, err);
        if (err.code === 'permission-denied') {
          setError("Permission denied. Please check Firestore security rules.");
          toast({title: "Firestore Error", description: "Permission denied. Check security rules.", variant: "destructive"});
        } else if (err.code === 'unimplemented' || (err.message && err.message.toLowerCase().includes('index')) || err.code === 'failed-precondition') {
            setError("Firestore query requires an index. Check Firebase console for a link to create it.");
            toast({title: "Firestore Error", description: `Query requires an index. Check Firebase console. (${err.message})`, variant: "destructive"});
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
          const parsedDate = parseISO(transactionData.date.includes('T') ? transactionData.date : `${transactionData.date}T00:00:00`);
          dateString = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      } else {
        dateString = format(transactionData.date, 'yyyy-MM-dd');
      }

      const newTransaction = {
        ...transactionData,
        date: dateString,
        userId: currentUser.uid,
      };
      await addDoc(collection(db, 'transactions'), newTransaction);
      toast({title: "Success", description: "Transaction added successfully!", variant: "default"});
      router.push('/'); // Navigate to dashboard after adding
    } catch (err: any) {
      console.error("[TransactionContext] Error adding transaction to Firestore:", err);
      setError(`Could not save the transaction: ${err.message}`);
      toast({ title: "Error", description: `Could not save the transaction: ${err.message}`, variant: "destructive"});
    }
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string }) => {
    if (!currentUser) {
      setError("You must be logged in to update a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to update a transaction.", variant: "destructive" });
      return;
    }
    setError(null);
    try {
      let dateString: string;
       if (typeof transactionData.date === 'string') {
          const parsedDate = parseISO(transactionData.date.includes('T') ? transactionData.date : `${transactionData.date}T00:00:00`);
          dateString = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      } else {
        dateString = format(transactionData.date, 'yyyy-MM-dd');
      }

      const transactionRef = doc(db, 'transactions', id);
      // Ensure userId is not accidentally updated, or if it is, it matches current user.
      const updatedTxData = {
        ...transactionData,
        date: dateString,
        userId: currentUser.uid, // Keep original userId or ensure it matches
      };
      await updateDoc(transactionRef, updatedTxData);
      toast({ title: "Success", description: "Transaction updated successfully!", variant: "default" });
      router.push('/'); // Navigate to dashboard after updating
    } catch (err: any) {
      console.error("[TransactionContext] Error updating transaction in Firestore:", err);
      setError(`Could not update the transaction: ${err.message}`);
      toast({ title: "Error", description: `Could not update the transaction: ${err.message}`, variant: "destructive" });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser) {
      setError("You must be logged in to delete a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to delete a transaction.", variant: "destructive" });
      return;
    }
    setError(null);
    try {
      const transactionRef = doc(db, 'transactions', id);
      // Optional: Add a check to ensure the transaction belongs to the user before deleting,
      // though security rules should primarily handle this.
      await deleteDoc(transactionRef);
      toast({ title: "Success", description: "Transaction deleted successfully!", variant: "default" });
    } catch (err: any) {
      console.error("[TransactionContext] Error deleting transaction from Firestore:", err);
      setError(`Could not delete the transaction: ${err.message}`);
      toast({ title: "Error", description: `Could not delete the transaction: ${err.message}`, variant: "destructive" });
    }
  };
  
  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    if (!currentUser) {
      setError("You must be logged in to fetch a transaction.");
      return null;
    }
    // First, check if the transaction is already in the local state
    const localTransaction = transactions.find(t => t.id === id);
    if (localTransaction) {
      return localTransaction;
    }

    // If not in local state, fetch from Firestore
    setLoading(true);
    setError(null);
    try {
      const transactionRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(transactionRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Security check: ensure fetched transaction belongs to the current user
        if (data.userId !== currentUser.uid) {
          setError("Permission denied. This transaction does not belong to you.");
          toast({ title: "Access Denied", description: "You do not have permission to view this transaction.", variant: "destructive" });
          setLoading(false);
          return null;
        }

        let formattedDate: string;
        if (typeof data.date === 'string') {
            const parsedDate = parseISO(data.date.includes('T') ? data.date : `${data.date}T00:00:00`);
            formattedDate = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        } else if (data.date instanceof Timestamp) {
          formattedDate = format(data.date.toDate(), 'yyyy-MM-dd');
        } else {
          formattedDate = format(new Date(), 'yyyy-MM-dd');
        }
        
        setLoading(false);
        return { id: docSnap.id, ...data, date: formattedDate } as Transaction;
      } else {
        setError("Transaction not found.");
        setLoading(false);
        return null;
      }
    } catch (err: any) {
      console.error("[TransactionContext] Error fetching transaction by ID:", err);
      setError(`Could not fetch transaction: ${err.message}`);
      setLoading(false);
      return null;
    }
  };


  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction, getTransactionById, loading, error }}>
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
