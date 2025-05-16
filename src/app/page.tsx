'use client';

import { FinancialSummary } from '@/components/dashboard/FinancialSummary';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Separator } from '@/components/ui/separator';
import { useTransactions } from '@/contexts/TransactionContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

export default function DashboardPage() {
  const { error: transactionContextError } = useTransactions();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      {transactionContextError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>{transactionContextError}</AlertDescription>
        </Alert>
      )}

      <FinancialSummary />
      <Separator />
      <SpendingChart />
      <Separator />
      <QuickActions />
    </div>
  );
}
