
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { PlusCircle, ListChecks, Edit3, Trash2, MoreHorizontal, Repeat } from 'lucide-react'; // Added Repeat
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export function RecentTransactions({ maxItems = 5 }: { maxItems?: number }) {
  const { transactions, loading, deleteTransaction } = useTransactions();
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const recentTransactions = transactions.slice(0, maxItems);

  const formatDateString = (dateStr: string) => {
    try {
      // Ensure date is parsed as UTC to avoid timezone shifts if only date is provided
      const parsedDate = parseISO(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00Z`);
      return format(parsedDate, 'MMM dd, yyyy');
    } catch (e) {
      console.warn("Failed to parse date for formatting:", dateStr, e);
      return dateStr; // fallback to original string
    }
  };

  const handleDelete = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null); // Close dialog
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
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-8 w-8" />
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
                  <TableHead className="text-center min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium whitespace-nowrap">{formatDateString(transaction.date)}</TableCell>
                    <TableCell className="truncate max-w-xs">
                      <div className="flex items-center gap-2">
                        {transaction.isRecurring && <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" title='Recurring' />}
                        <span className="truncate">{transaction.description}</span>
                      </div>
                    </TableCell>
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
                    <TableCell className="text-center">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/transactions/edit/${transaction.id}`} className="flex items-center w-full">
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTransactionToDelete(transaction)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {transactionToDelete && (
        <AlertDialog open={!!transactionToDelete} onOpenChange={() => setTransactionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the transaction
                 "{transactionToDelete.description}" amounting to ${transactionToDelete.amount.toFixed(2)}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}
