
'use client';

import type { Budget, BudgetFormData } from '@/lib/types';
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
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  FirestoreError,
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budgetData: Omit<BudgetFormData, 'id'>) => Promise<string | null>;
  updateBudget: (id: string, budgetData: Omit<BudgetFormData, 'id'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      setError(null);
      const budgetsCollectionRef = collection(db, 'budgets');
      const q = query(
        budgetsCollectionRef,
        where('userId', '==', currentUser.uid),
        orderBy('month', 'desc'),
        orderBy('category', 'asc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userBudgets: Budget[] = [];
        querySnapshot.forEach((document) => {
          userBudgets.push({ id: document.id, ...document.data() } as Budget);
        });
        setBudgets(userBudgets);
        setLoading(false);
      }, (err: FirestoreError) => {
        console.error("[BudgetContext] Error fetching budgets:", err);
        setError("Could not load budgets. " + (err.code === 'failed-precondition' ? "A Firestore index might be required." : err.message));
        toast({ title: "Storage Error", description: "Could not load budgets. " + (err.code === 'failed-precondition' ? "Check Firestore indexes." : ""), variant: "destructive"});
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setBudgets([]);
      setLoading(false);
    }
  }, [currentUser, toast]);

  const addBudget = useCallback(async (budgetData: Omit<BudgetFormData, 'id'>): Promise<string | null> => {
    if (!currentUser) {
      setError("You must be logged in to add a budget.");
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return null;
    }
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'budgets'), {
        ...budgetData,
        userId: currentUser.uid,
      });
      toast({ title: "Success", description: "Budget added successfully!", variant: "default" });
      return docRef.id;
    } catch (err: any) {
      console.error("[BudgetContext] Error adding budget:", err);
      setError(`Could not save the budget: ${err.message}`);
      toast({ title: "Error", description: `Could not save budget: ${err.message}`, variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);

  const updateBudget = useCallback(async (id: string, budgetData: Omit<BudgetFormData, 'id'>) => {
    if (!currentUser) {
      setError("You must be logged in to update a budget.");
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setError(null);
    try {
      const budgetRef = doc(db, 'budgets', id);
      // Ensure userId isn't accidentally overwritten if it's part of budgetData
      const dataToUpdate = { ...budgetData };
      if ('userId' in dataToUpdate) {
        delete (dataToUpdate as any).userId;
      }
      await updateDoc(budgetRef, dataToUpdate);
      toast({ title: "Success", description: "Budget updated successfully!", variant: "default" });
    } catch (err: any) {
      console.error("[BudgetContext] Error updating budget:", err);
      setError(`Could not update the budget: ${err.message}`);
      toast({ title: "Error", description: `Could not update budget: ${err.message}`, variant: "destructive" });
    }
  }, [currentUser, toast]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!currentUser) {
      setError("You must be logged in to delete a budget.");
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setError(null);
    try {
      const budgetRef = doc(db, 'budgets', id);
      await deleteDoc(budgetRef);
      toast({ title: "Success", description: "Budget deleted successfully!", variant: "default" });
    } catch (err: any) {
      console.error("[BudgetContext] Error deleting budget:", err);
      setError(`Could not delete the budget: ${err.message}`);
      toast({ title: "Error", description: `Could not delete budget: ${err.message}`, variant: "destructive" });
    }
  }, [currentUser, toast]);

  return (
    <BudgetContext.Provider value={{ budgets, addBudget, updateBudget, deleteBudget, loading, error }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudgets() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets must be used within a BudgetProvider');
  }
  return context;
}
