
'use client';

import React, { useState } from 'react';
import { useBudgets } from '@/contexts/BudgetContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import Loading from '@/app/loading';
import type { Budget } from '@/lib/types';
import { PlusCircle, Edit3, Trash2, MoreHorizontal, PiggyBank } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { format, parse } from 'date-fns';

export default function BudgetsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { budgets, loading: budgetsLoading, deleteBudget, error: budgetContextError } = useBudgets();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || budgetsLoading || !currentUser) {
    return <Loading />;
  }

  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsFormOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleDeleteBudget = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete.id);
      setBudgetToDelete(null);
    }
  };
  
  const formatMonthYear = (monthStr: string) => {
    try {
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch (e) {
      return monthStr; // Fallback if parsing fails
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <PiggyBank className="h-8 w-8 text-primary" /> Monthly Budgets
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddBudget} className="shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
            </DialogHeader>
            <BudgetForm 
              initialData={editingBudget} 
              onSuccess={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {budgetContextError && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>{budgetContextError}</AlertDescription>
        </Alert>
      )}

      {budgets.length === 0 && !budgetsLoading && !budgetContextError && (
        <Card className="text-center py-10 shadow-sm">
          <CardHeader>
            <CardTitle>No Budgets Yet</CardTitle>
            <CardDescription>Start planning your finances by adding your first budget.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={handleAddBudget}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {budgets.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
             <CardTitle>Your Budgets</CardTitle>
             <CardDescription>Overview of your monthly financial plans.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Month</TableHead>
                    <TableHead className="min-w-[150px]">Category</TableHead>
                    <TableHead className="text-right min-w-[120px]">Allocated Amount</TableHead>
                    <TableHead className="text-center min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{formatMonthYear(budget.month)}</TableCell>
                      <TableCell>{budget.category}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${budget.allocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            <DropdownMenuItem onClick={() => handleEditBudget(budget)} className="flex items-center w-full">
                              <Edit3 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setBudgetToDelete(budget)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
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
          </CardContent>
        </Card>
      )}

      {budgetToDelete && (
        <AlertDialog open={!!budgetToDelete} onOpenChange={() => setBudgetToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the budget for 
                {` ${budgetToDelete.category} in ${formatMonthYear(budgetToDelete.month)} ($${budgetToDelete.allocatedAmount.toFixed(2)})`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
