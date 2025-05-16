'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button asChild className="flex-1 shadow-md hover:shadow-lg transition-shadow">
        <Link href="/transactions/add">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Transaction
        </Link>
      </Button>
      <Button asChild variant="secondary" className="flex-1 shadow-md hover:shadow-lg transition-shadow">
        <Link href="/forecast">
          <TrendingUp className="mr-2 h-5 w-5" /> AI Expense Forecast
        </Link>
      </Button>
    </div>
  );
}
