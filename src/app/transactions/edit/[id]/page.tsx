
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useTransactions } from '@/contexts/TransactionContext';
import type { Transaction } from '@/lib/types';
import Loading from '@/app/loading';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function EditTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const { getTransactionById, loading: transactionLoading } = useTransactions();
  const { currentUser, loading: authLoading } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const id = typeof params.id === 'string' ? params.id : null;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (id && currentUser) { // Ensure currentUser is available before fetching
      setIsFetching(true);
      setError(null);
      getTransactionById(id)
        .then((data) => {
          if (data) {
            setTransaction(data);
          } else {
            setError('Transaction not found or you do not have permission to edit it.');
          }
        })
        .catch((err) => {
          console.error("Error fetching transaction for edit:", err);
          setError('Failed to load transaction details.');
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else if (!id) {
        setError("Transaction ID is missing.");
        setIsFetching(false);
    }
  }, [id, getTransactionById, currentUser]); // Add currentUser to dependency array

  if (authLoading || isFetching || transactionLoading) {
    return <Loading />;
  }
  
  if (!currentUser) {
      // This case should ideally be caught by the first useEffect redirecting to login,
      // but as a fallback:
      return <Loading />; // Or a message indicating user needs to be logged in
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              Error Loading Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/')} className="mt-4 w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transaction) {
    // This case should ideally be covered by the error state, but as a fallback:
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
         <p>Transaction could not be loaded.</p>
         <Button onClick={() => router.push('/')} className="mt-4">
            Back to Dashboard
          </Button>
       </div>
    );
  }

  return (
    <div className="space-y-6">
      <TransactionForm initialData={transaction} isEditMode={true} />
    </div>
  );
}
