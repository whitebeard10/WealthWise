
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Budget, BudgetFormData } from '@/lib/types';
import { useBudgets } from '@/contexts/BudgetContext';
import { format, parse } from 'date-fns';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  allocatedAmount: z.coerce.number().positive('Allocated amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format (e.g., 2024-07)'),
});

// Default categories - can be expanded or fetched dynamically later
const defaultCategories = [
  "Food & Drinks", "Shopping", "Housing", "Transportation", "Vehicle",
  "Life & Entertainment", "Communication & PC", "Financial Expenses",
  "Investments", "Income", "Others"
];

interface BudgetFormProps {
  initialData?: Budget | null;
  onSuccess?: () => void; // Callback after successful submission
}

export function BudgetForm({ initialData, onSuccess }: BudgetFormProps) {
  const { addBudget, updateBudget } = useBudgets();
  const isEditMode = !!initialData;

  const form = useForm<Omit<BudgetFormData, 'id'>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: initialData?.category || '',
      allocatedAmount: initialData?.allocatedAmount || 0,
      month: initialData?.month || format(new Date(), 'yyyy-MM'),
    },
  });

  const onSubmit = async (data: Omit<BudgetFormData, 'id'>) => {
    if (isEditMode && initialData?.id) {
      await updateBudget(initialData.id, data);
    } else {
      await addBudget(data);
    }
    form.reset();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {defaultCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
      </div>

      {/* Allocated Amount */}
      <div className="space-y-2">
        <Label htmlFor="allocatedAmount">Allocated Amount ($)</Label>
        <Input id="allocatedAmount" type="number" step="0.01" {...form.register('allocatedAmount')} placeholder="0.00" />
        {form.formState.errors.allocatedAmount && <p className="text-sm text-destructive">{form.formState.errors.allocatedAmount.message}</p>}
      </div>

      {/* Month */}
      <div className="space-y-2">
        <Label htmlFor="month">Month (YYYY-MM)</Label>
        <Input id="month" type="text" {...form.register('month')} placeholder="e.g., 2024-07" />
        {form.formState.errors.month && <p className="text-sm text-destructive">{form.formState.errors.month.message}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditMode ? 'Update Budget' : 'Add Budget'}
      </Button>
    </form>
  );
}
