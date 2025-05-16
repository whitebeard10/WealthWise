'use client';

import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function AddTransactionPage() {
  return (
    <div className="space-y-6">
      {/* The title and description are now part of the TransactionForm card. 
          If a page-level title is needed, it can be added here. */}
      <TransactionForm />
    </div>
  );
}
