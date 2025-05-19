
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/contexts/TransactionContext";
import type { Transaction } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ListChecks } from 'lucide-react';

export function RecentTransactions({ maxItems = 5 }: { maxItems?: number }) {
  const { transactions, loading } = useTransactions();

  const recentTransactions = transactions.slice(0, maxItems);

  const formatDateString = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      console.warn("Failed to parse date for formatting:", dateStr, e);
      return dateStr; 
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-primary"/>
                    Recent Transactions
                </CardTitle>
                <CardDescription>
                    Your last {loading || recentTransactions.length === 0 ? maxItems : recentTransactions.length} recorded transactions.
                </CardDescription>
            </div>
            {/* Optional: Could add a "View All" button here if you create a full transactions page */}
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-3 py-2">
            {[...Array(Math.min(maxItems, 3))].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-2 space-x-4 rounded-md">
                <div className="space-y-1 flex-grow">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-1/4" />
              </div>
            ))}
          </div>
        )}
        {!loading && recentTransactions.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <p className="text-lg text-muted-foreground">No transactions recorded yet.</p>
            <p className="text-sm text-muted-foreground">Let's get started by adding your first one!</p>
            <Button asChild variant="default" className="mt-2">
              <Link href="/transactions/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Link>
            </Button>
          </div>
        )}
        {!loading && recentTransactions.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="min-w-[100px]">Category</TableHead>
                  <TableHead className="min-w-[80px]">Type</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium whitespace-nowrap">{formatDateString(transaction.date)}</TableCell>
                    <TableCell className="truncate max-w-xs">{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      className={`text-right font-semibold whitespace-nowrap ${
                        transaction.type === 'income' ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}$
                      {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
