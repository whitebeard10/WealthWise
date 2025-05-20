
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

// Define a more specific type for data passed to add/update functions
type TransactionInputData = Omit<Transaction, 'id' | 'userId' | 'date' | 'recurrenceEndDate'> & {
  date: Date | string;
  recurrenceEndDate?: Date | string | null; // Allow Date, string, or null
};


interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: TransactionInputData) => Promise<void>;
  updateTransaction: (id: string, transactionData: TransactionInputData) => Promise<void>;
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
          // console.log('[TransactionContext] Processing documents...');
        }

        querySnapshot.forEach((document) => {
          // console.log(`[TransactionContext] Attempting to process doc ${document.id}`);
          try {
            const data = document.data();
            //  if (querySnapshot.docs[0] === document) {
            //   console.log('[TransactionContext] Raw data of first doc:', { id: document.id, ...data });
            // }

            let formattedDate: string;
            if (typeof data.date === 'string') {
              try {
                const parsedDate = parseISO(data.date.includes('T') ? data.date : `${data.date}T00:00:00Z`);
                if (isValid(parsedDate)) {
                  formattedDate = format(parsedDate, 'yyyy-MM-dd');
                } else {
                  throw new Error('Invalid date string after attempting to make it ISO compatible');
                }
              } catch (e) {
                console.warn(`[TransactionContext] Could not parse date string "${data.date}" for doc ${document.id}. Using as is or defaulting. Error: ${e}`, e);
                const parts = data.date.split('-');
                if(parts.length === 3 && parts.every((p:string) => !isNaN(parseInt(p)))) {
                    formattedDate = data.date; 
                } else {
                    formattedDate = format(new Date(), 'yyyy-MM-dd'); 
                }
              }
            } else if (data.date instanceof Timestamp) {
              formattedDate = format(data.date.toDate(), 'yyyy-MM-dd');
            } else {
              console.warn(`[TransactionContext] Unexpected date format for doc ${document.id}:`, data.date, ". Defaulting to today.");
              formattedDate = format(new Date(), 'yyyy-MM-dd');
            }
            
            let formattedRecurrenceEndDate: string | null = null;
            if (data.recurrenceEndDate) {
              if (typeof data.recurrenceEndDate === 'string') {
                 try {
                    const parsedDate = parseISO(data.recurrenceEndDate.includes('T') ? data.recurrenceEndDate : `${data.recurrenceEndDate}T00:00:00Z`);
                    if (isValid(parsedDate)) {
                        formattedRecurrenceEndDate = format(parsedDate, 'yyyy-MM-dd');
                    } else { /* Keep null if invalid */ }
                 } catch (e) { /* Keep null if error */ }
              } else if (data.recurrenceEndDate instanceof Timestamp) {
                formattedRecurrenceEndDate = format(data.recurrenceEndDate.toDate(), 'yyyy-MM-dd');
              }
            }


            userTransactions.push({
              id: document.id,
              description: data.description,
              amount: data.amount,
              type: data.type,
              date: formattedDate,
              category: data.category,
              userId: data.userId,
              isRecurring: data.isRecurring || false,
              recurrenceFrequency: data.recurrenceFrequency || 'none',
              recurrenceEndDate: formattedRecurrenceEndDate,
            } as Transaction);
          } catch (e) {
            console.error(`[TransactionContext] Error processing document ${document.id}:`, e);
            setError(`Error processing transaction data for doc ${document.id}. See console.`);
          }
        });
        
        console.log('[TransactionContext] Processed documents. Resulting userTransactions:', JSON.stringify(userTransactions.map(t => ({id: t.id, date: t.date, recurrenceEndDate: t.recurrenceEndDate})), null, 2));


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
            setError(`Firestore query requires an index. Check Firebase console for a link to create it or details. Error: ${err.message}`);
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

  const prepareTransactionDataForFirestore = (transactionData: TransactionInputData) => {
    let dateString: string;
    if (typeof transactionData.date === 'string') {
        const parsedDate = parseISO(transactionData.date.includes('T') ? transactionData.date : `${transactionData.date}T00:00:00Z`);
        dateString = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    } else {
      dateString = format(transactionData.date, 'yyyy-MM-dd');
    }

    let recurrenceEndDateString: string | null = null;
    if (transactionData.isRecurring && transactionData.recurrenceEndDate) {
      if (typeof transactionData.recurrenceEndDate === 'string') {
        const parsedRecEndDate = parseISO(transactionData.recurrenceEndDate.includes('T') ? transactionData.recurrenceEndDate : `${transactionData.recurrenceEndDate}T00:00:00Z`);
        recurrenceEndDateString = isValid(parsedRecEndDate) ? format(parsedRecEndDate, 'yyyy-MM-dd') : null;
      } else if (transactionData.recurrenceEndDate instanceof Date) { // Check if it's a Date object
        recurrenceEndDateString = format(transactionData.recurrenceEndDate, 'yyyy-MM-dd');
      }
    }
    
    return {
      ...transactionData,
      date: dateString,
      recurrenceFrequency: transactionData.isRecurring ? transactionData.recurrenceFrequency : 'none',
      recurrenceEndDate: transactionData.isRecurring ? recurrenceEndDateString : null,
      userId: currentUser!.uid, // currentUser is checked before calling this path
    };
  };


  const addTransaction = async (transactionData: TransactionInputData) => {
    if (!currentUser) {
      setError("You must be logged in to add a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to add a transaction.", variant: "destructive"});
      return;
    }
    setError(null);
    try {
      const newTransaction = prepareTransactionDataForFirestore(transactionData);
      await addDoc(collection(db, 'transactions'), newTransaction);
      toast({title: "Success", description: "Transaction added successfully!", variant: "default"});
      router.push('/'); 
    } catch (err: any) {
      console.error("[TransactionContext] Error adding transaction to Firestore:", err);
      setError(`Could not save the transaction: ${err.message}`);
      toast({ title: "Error", description: `Could not save the transaction: ${err.message}`, variant: "destructive"});
    }
  };

  const updateTransaction = async (id: string, transactionData: TransactionInputData) => {
    if (!currentUser) {
      setError("You must be logged in to update a transaction.");
      toast({ title: "Authentication Error", description: "You must be logged in to update a transaction.", variant: "destructive" });
      return;
    }
    setError(null);
    try {
      const transactionRef = doc(db, 'transactions', id);
      const updatedTxData = prepareTransactionDataForFirestore(transactionData);
      await updateDoc(transactionRef, updatedTxData);
      toast({ title: "Success", description: "Transaction updated successfully!", variant: "default" });
      router.push('/'); 
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
    
    const localTransaction = transactions.find(t => t.id === id);
    if (localTransaction) {
      return localTransaction;
    }

    setLoading(true);
    setError(null);
    try {
      const transactionRef = doc(db, 'transactions', id);
      const docSnap = await getDoc(transactionRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.userId !== currentUser.uid) {
          setError("Permission denied. This transaction does not belong to you.");
          toast({ title: "Access Denied", description: "You do not have permission to view this transaction.", variant: "destructive" });
          setLoading(false);
          return null;
        }

        let formattedDate: string;
        if (typeof data.date === 'string') {
            const parsedDate = parseISO(data.date.includes('T') ? data.date : `${data.date}T00:00:00Z`);
            formattedDate = isValid(parsedDate) ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        } else if (data.date instanceof Timestamp) {
          formattedDate = format(data.date.toDate(), 'yyyy-MM-dd');
        } else {
          formattedDate = format(new Date(), 'yyyy-MM-dd');
        }

        let formattedRecurrenceEndDate: string | null = null;
        if (data.recurrenceEndDate) {
            if (typeof data.recurrenceEndDate === 'string') {
                const parsedDate = parseISO(data.recurrenceEndDate.includes('T') ? data.recurrenceEndDate : `${data.recurrenceEndDate}T00:00:00Z`);
                if (isValid(parsedDate)) {
                    formattedRecurrenceEndDate = format(parsedDate, 'yyyy-MM-dd');
                }
            } else if (data.recurrenceEndDate instanceof Timestamp) {
                formattedRecurrenceEndDate = format(data.recurrenceEndDate.toDate(), 'yyyy-MM-dd');
            }
        }
        
        setLoading(false);
        return { 
            id: docSnap.id, 
            ...data, 
            date: formattedDate,
            isRecurring: data.isRecurring || false,
            recurrenceFrequency: data.recurrenceFrequency || 'none',
            recurrenceEndDate: formattedRecurrenceEndDate
        } as Transaction;

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
