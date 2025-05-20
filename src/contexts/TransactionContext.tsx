
'use client';

import type { Transaction } from '@/lib/types';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  writeBatch,
} from 'firebase/firestore';
import { format, parseISO, isValid, isSameDay, startOfToday, addDays, addWeeks, addMonths, addYears, isBefore, isEqual } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

// Define a more specific type for data passed to add/update functions
type TransactionInputData = Omit<Transaction, 'id' | 'userId' | 'date' | 'recurrenceEndDate'> & {
  date: Date | string;
  recurrenceEndDate?: Date | string | null; // Allow Date, string, or null
};


interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transactionData: TransactionInputData, options?: { navigate?: boolean; showToast?: boolean }) => Promise<string | null>;
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
  const [processedRecurringTemplates, setProcessedRecurringTemplates] = useState<Set<string>>(new Set());


  const internalAddTransaction = useCallback(async (transactionData: TransactionInputData): Promise<string | null> => {
    if (!currentUser) return null;
    try {
      const newTransaction = prepareTransactionDataForFirestore(transactionData, currentUser.uid);
      const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
      return docRef.id;
    } catch (err: any) {
      console.error("[TransactionContext] Error adding transaction internally:", err);
      // Avoid setting global error or showing toast for internal adds
      return null;
    }
  }, [currentUser]);


  const checkAndLogRecurringTransactions = useCallback(async (allTransactions: Transaction[]) => {
    if (!currentUser) return;
    console.log('[TransactionContext] Starting checkAndLogRecurringTransactions. Total transactions loaded:', allTransactions.length);

    const recurringTemplates = allTransactions.filter(t => t.isRecurring && t.recurrenceFrequency && t.recurrenceFrequency !== 'none');
    if (recurringTemplates.length === 0) {
      console.log('[TransactionContext] No recurring templates found to process.');
      return;
    }

    console.log(`[TransactionContext] Found ${recurringTemplates.length} recurring templates.`);
    const batch = writeBatch(db);
    let transactionsAddedInBatch = 0;
    const today = startOfToday();

    for (const template of recurringTemplates) {
      if (!template.id) continue; // Should not happen with Firestore data
      console.log(`[TransactionContext] Processing template ID: ${template.id}, Description: ${template.description}`);

      let originalTransactionDate: Date;
      try {
        originalTransactionDate = parseISO(template.date.includes('T') ? template.date : `${template.date}T00:00:00Z`);
        if (!isValid(originalTransactionDate)) {
          console.warn(`[TransactionContext] Template ${template.id} has invalid date: ${template.date}. Skipping.`);
          continue;
        }
      } catch (e) {
        console.warn(`[TransactionContext] Error parsing date for template ${template.id}: ${template.date}. Skipping. Error: ${e}`);
        continue;
      }
      console.log(`[TransactionContext] Template ${template.id} - Original Date: ${format(originalTransactionDate, 'yyyy-MM-dd')}`);


      let endDate: Date | null = null;
      if (template.recurrenceEndDate) {
        try {
          endDate = parseISO(template.recurrenceEndDate.includes('T') ? template.recurrenceEndDate : `${template.recurrenceEndDate}T00:00:00Z`);
          if (!isValid(endDate)) {
            console.warn(`[TransactionContext] Template ${template.id} has invalid recurrenceEndDate: ${template.recurrenceEndDate}. Treating as no end date.`);
            endDate = null;
          } else {
             console.log(`[TransactionContext] Template ${template.id} - Recurrence End Date: ${format(endDate, 'yyyy-MM-dd')}`);
          }
        } catch (e) {
          console.warn(`[TransactionContext] Error parsing recurrenceEndDate for template ${template.id}: ${template.recurrenceEndDate}. Treating as no end date. Error: ${e}`);
          endDate = null;
        }
      }

      let currentRecurrenceDate = originalTransactionDate;
      console.log(`[TransactionContext] Template ${template.id} - Today (for comparison): ${format(today, 'yyyy-MM-dd')}`);
      console.log(`[TransactionContext] Template ${template.id} - Initial currentRecurrenceDate: ${format(currentRecurrenceDate, 'yyyy-MM-dd')}`);


      // Loop to generate instances up to 'today'
      while (isBefore(currentRecurrenceDate, today) || isEqual(currentRecurrenceDate, today)) {
        console.log(`[TransactionContext] Template ${template.id} - Considering date: ${format(currentRecurrenceDate, 'yyyy-MM-dd')}`);
        if (endDate && isBefore(endDate, currentRecurrenceDate)) {
          console.log(`[TransactionContext] Template ${template.id} - Current recurrence date ${format(currentRecurrenceDate, 'yyyy-MM-dd')} is after end date ${format(endDate, 'yyyy-MM-dd')}. Stopping for this template.`);
          break; // Past the end date for this template
        }

        // Check if an instance for this date (from this template) already exists
        const findExisting = allTransactions.find(
          t => !t.isRecurring && // only find actual logged instances, not other templates
          t.description === template.description &&
          t.amount === template.amount &&
          t.type === template.type &&
          t.category === template.category &&
          isValid(parseISO(t.date)) && // ensure existing transaction date is valid
          isSameDay(parseISO(t.date.includes('T') ? t.date : `${t.date}T00:00:00Z`), currentRecurrenceDate)
        );

        if (!findExisting) {
          console.log(`[TransactionContext] Template ${template.id} - No existing transaction found for ${format(currentRecurrenceDate, 'yyyy-MM-dd')}. Logging new one.`);
          const newInstanceData: Omit<Transaction, 'id' | 'userId'> = {
            description: template.description,
            amount: template.amount,
            type: template.type,
            date: format(currentRecurrenceDate, 'yyyy-MM-dd'), // Ensure correct format
            category: template.category,
            isRecurring: false, // Logged instances are not themselves recurring templates
            recurrenceFrequency: 'none',
            recurrenceEndDate: null,
          };
          // Using internalAddTransaction requires data matching TransactionInputData structure
          const preparedData = prepareTransactionDataForFirestore(newInstanceData as TransactionInputData, currentUser.uid);
          const newDocRef = doc(collection(db, 'transactions')); // Generate new doc ref for batch
          batch.set(newDocRef, preparedData);
          transactionsAddedInBatch++;
        } else {
          console.log(`[TransactionContext] Template ${template.id} - Existing transaction found for ${format(currentRecurrenceDate, 'yyyy-MM-dd')}. Skipping.`);
        }

        // Increment currentRecurrenceDate
        switch (template.recurrenceFrequency) {
          case 'daily':
            currentRecurrenceDate = addDays(currentRecurrenceDate, 1);
            break;
          case 'weekly':
            currentRecurrenceDate = addWeeks(currentRecurrenceDate, 1);
            break;
          case 'monthly':
            currentRecurrenceDate = addMonths(currentRecurrenceDate, 1);
            break;
          case 'yearly':
            currentRecurrenceDate = addYears(currentRecurrenceDate, 1);
            break;
          default:
            console.warn(`[TransactionContext] Template ${template.id} - Unknown frequency: ${template.recurrenceFrequency}. Stopping for this template.`);
            // Break from inner while loop for this template
            currentRecurrenceDate = addDays(today,1); // to break the loop
            continue; 
        }
        if (isBefore(originalTransactionDate, currentRecurrenceDate) && isEqual(originalTransactionDate, addDays(currentRecurrenceDate, -1)) && template.recurrenceFrequency === 'daily') {
            // Safety break for daily to prevent potential infinite loops if date logic is flawed, very unlikely with date-fns
            if (currentRecurrenceDate > addYears(originalTransactionDate, 5)) { // Arbitrary 5 year limit for safety
                 console.warn(`[TransactionContext] Template ${template.id} - Daily recurrence safety break reached. Stopping.`);
                 break;
            }
        }
      }
       console.log(`[TransactionContext] Template ${template.id} - Finished processing potential dates.`);
    }

    if (transactionsAddedInBatch > 0) {
      try {
        await batch.commit();
        console.log(`[TransactionContext] Successfully added ${transactionsAddedInBatch} new recurring transaction instances.`);
        toast({ title: "Recurring Transactions", description: `${transactionsAddedInBatch} recurring transactions were logged.`, variant: "default" });
        // No need to manually re-fetch, onSnapshot will update the list
      } catch (err) {
        console.error("[TransactionContext] Error committing batch for recurring transactions:", err);
        toast({ title: "Error", description: "Could not log some recurring transactions.", variant: "destructive" });
      }
    } else {
        console.log("[TransactionContext] No new recurring instances needed to be logged in this run.");
    }
    // Mark templates as processed for this session, though this needs refinement for true idempotency across sessions/reloads
    // recurringTemplates.forEach(t => t.id && processedRecurringTemplates.add(t.id));

  }, [currentUser, toast, internalAddTransaction, processedRecurringTemplates]);


  useEffect(() => {
    setLoading(true);
    setError(null);
    setProcessedRecurringTemplates(new Set()); // Reset processed templates on user change

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
        }

        querySnapshot.forEach((document) => {
          try {
            const data = document.data();
            let formattedDate: string;
            if (typeof data.date === 'string') {
                const parsedDate = parseISO(data.date.includes('T') ? data.date : `${data.date}T00:00:00Z`);
                if (isValid(parsedDate)) {
                  formattedDate = format(parsedDate, 'yyyy-MM-dd');
                } else {
                  throw new Error('Invalid date string after attempting to make it ISO compatible');
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
                    }
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
        
        console.log('[TransactionContext] Processed documents. Resulting userTransactions (before recurring check):', JSON.stringify(userTransactions.map(t => ({id: t.id, date: t.date, isRecurring: t.isRecurring, freq: t.recurrenceFrequency})), null, 2).substring(0, 500) + "...");

        setTransactions(userTransactions);
        setLoading(false);
        setError(null);
        
        // After transactions are loaded and state is updated, check for recurring ones.
        // Run this asynchronously to not block the initial render of loaded transactions.
        if(userTransactions.length > 0) {
             setTimeout(() => checkAndLogRecurringTransactions(userTransactions), 0);
        }


      }, (err: FirestoreError) => {
        console.error("[TransactionContext] Error fetching transactions from Firestore:", err.code, err.message, err);
        if (err.code === 'permission-denied') {
          setError("Permission denied. Please check Firestore security rules.");
          toast({title: "Firestore Error", description: "Permission denied. Check security rules.", variant: "destructive"});
        } else if (err.code === 'unimplemented' || (err.message && err.message.toLowerCase().includes('index')) || err.code === 'failed-precondition') {
            const indexCreationLinkRegex = /(https:\/\/[^ ]*indexes\?create_composite=[^ ]*)/;
            const match = err.message.match(indexCreationLinkRegex);
            const link = match ? match[0] : "Check Firebase console for a link to create it or details.";
            const detailedMessage = `Firestore query requires an index. ${link} Error: ${err.message}`;
            setError(detailedMessage);
            toast({title: "Firestore Error", description: `Query requires an index. Check Firebase console. (${err.message})`, variant: "destructive", duration: 10000});
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, toast, checkAndLogRecurringTransactions]); // checkAndLogRecurringTransactions is now stable due to useCallback

  const prepareTransactionDataForFirestore = (transactionData: TransactionInputData, userId: string) => {
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
      } else if (transactionData.recurrenceEndDate instanceof Date) { 
        recurrenceEndDateString = format(transactionData.recurrenceEndDate, 'yyyy-MM-dd');
      }
    }
    
    return {
      ...transactionData,
      date: dateString,
      recurrenceFrequency: transactionData.isRecurring ? transactionData.recurrenceFrequency : 'none',
      recurrenceEndDate: transactionData.isRecurring ? recurrenceEndDateString : null,
      userId: userId, 
    };
  };


  const addTransaction = async (transactionData: TransactionInputData, options: { navigate?: boolean; showToast?: boolean } = { navigate: true, showToast: true }): Promise<string | null> => {
    if (!currentUser) {
      setError("You must be logged in to add a transaction.");
      if(options.showToast) toast({ title: "Authentication Error", description: "You must be logged in to add a transaction.", variant: "destructive"});
      return null;
    }
    setError(null);
    try {
      const newTransaction = prepareTransactionDataForFirestore(transactionData, currentUser.uid);
      const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
      if(options.showToast) toast({title: "Success", description: "Transaction added successfully!", variant: "default"});
      if(options.navigate) router.push('/'); 
      return docRef.id;
    } catch (err: any) {
      console.error("[TransactionContext] Error adding transaction to Firestore:", err);
      setError(`Could not save the transaction: ${err.message}`);
      if(options.showToast) toast({ title: "Error", description: `Could not save the transaction: ${err.message}`, variant: "destructive"});
      return null;
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
      const updatedTxData = prepareTransactionDataForFirestore(transactionData, currentUser.uid);
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

    