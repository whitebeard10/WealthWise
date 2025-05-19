
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

export function RecentTransactions({ maxItems = 5 }: { maxItems?: number }) {
  const { transactions, loading } = useTransactions();

  // Transactions are already sorted by date desc in TransactionContext
  const recentTransactions = transactions.slice(0, maxItems);

  const formatDateString = (dateStr: string) => {
    try {
      // Assuming dateStr is in 'yyyy-MM-dd' format
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      // Fallback if parsing fails, though dates from Firestore should be valid ISO strings or Timestamps
      console.warn("Failed to parse date for formatting:", dateStr, e);
      return dateStr; 
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your last {loading || recentTransactions.length === 0 ? maxItems : recentTransactions.length} recorded transactions.
          </CardDescription>
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
          <p className="text-sm text-muted-foreground text-center py-10">No transactions recorded yet.</p>
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
