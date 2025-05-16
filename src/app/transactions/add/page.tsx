
'use client';

import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter }from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function AddTransactionPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* The title and description are now part of the TransactionForm card. 
          If a page-level title is needed, it can be added here. */}
      <TransactionForm />
    </div>
  );
}
