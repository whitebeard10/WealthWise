
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Loader2, Wand2 } from 'lucide-react';
import { format, parseISO, isValid, set } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/contexts/TransactionContext';
import type { Transaction } from '@/lib/types';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction';
import type { CategorizeTransactionOutput } from '@/ai/flows/categorize-transaction';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  date: z.date({ required_error: "A date is required."}),
  category: z.string().min(1, 'Category is required'),
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrenceEndDate: z.date().nullable().optional(),
}).refine(data => {
  if (data.isRecurring && (!data.recurrenceFrequency || data.recurrenceFrequency === 'none')) {
    return false;
  }
  return true;
}, {
  message: "Recurrence frequency must be selected if transaction is recurring.",
  path: ["recurrenceFrequency"],
}).refine(data => {
  if (data.isRecurring && data.recurrenceEndDate && data.recurrenceEndDate < data.date) {
    return false;
  }
  return true;
}, {
  message: "Recurrence end date cannot be before the transaction date.",
  path: ["recurrenceEndDate"],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const defaultCategories = [
  "Food & Drinks", "Shopping", "Housing", "Transportation", "Vehicle",
  "Life & Entertainment", "Communication & PC", "Financial Expenses",
  "Investments", "Income", "Others"
];

interface TransactionFormProps {
  initialData?: Transaction | null;
  isEditMode?: boolean;
}

export function TransactionForm({ initialData, isEditMode = false }: TransactionFormProps) {
  const { addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();
  const router = useRouter();
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<CategorizeTransactionOutput | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(defaultCategories);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount || 0,
      type: initialData?.type || 'expense',
      date: initialData?.date ? (isValid(parseISO(initialData.date)) ? parseISO(initialData.date) : new Date()) : new Date(),
      category: initialData?.category || '',
      isRecurring: initialData?.isRecurring || false,
      recurrenceFrequency: initialData?.recurrenceFrequency || 'none',
      recurrenceEndDate: initialData?.recurrenceEndDate && isValid(parseISO(initialData.recurrenceEndDate)) ? parseISO(initialData.recurrenceEndDate) : null,
    },
  });

  const isRecurringValue = form.watch('isRecurring');

  useEffect(() => {
    if (initialData) {
      const formDate = initialData.date ? parseISO(initialData.date) : new Date();
      const formRecurrenceEndDate = initialData.recurrenceEndDate ? parseISO(initialData.recurrenceEndDate) : null;

      if (!isValid(formDate)) {
        console.warn("Initial data had an invalid date string:", initialData.date);
      }
      if (initialData.recurrenceEndDate && !isValid(formRecurrenceEndDate)) {
        console.warn("Initial data had an invalid recurrence end date string:", initialData.recurrenceEndDate);
      }

      form.reset({
        ...initialData,
        date: isValid(formDate) ? formDate : new Date(),
        isRecurring: initialData.isRecurring || false,
        recurrenceFrequency: initialData.recurrenceFrequency || 'none',
        recurrenceEndDate: formRecurrenceEndDate && isValid(formRecurrenceEndDate) ? formRecurrenceEndDate : null,
      });
      if (initialData.category && !defaultCategories.includes(initialData.category)) {
        setAvailableCategories(prev => {
          if (prev.includes(initialData.category!)) return prev;
          return [initialData.category!, ...prev.filter(c => c !== initialData.category!)];
        });
      }
    } else {
        form.reset({
            description: '',
            amount: 0,
            type: 'expense',
            date: new Date(),
            category: '',
            isRecurring: false,
            recurrenceFrequency: 'none',
            recurrenceEndDate: null,
        });
        setAvailableCategories(defaultCategories);
    }
  }, [initialData, form]);


  const descriptionValue = form.watch('description');

  useEffect(() => {
    if (suggestedCategory?.category) {
      const newCategory = suggestedCategory.category;
      setAvailableCategories(prev => {
        if (prev.includes(newCategory)) return prev;
        return [newCategory, ...prev.filter(c => c !== newCategory)];
      });
      if (!isEditMode || (isEditMode && !form.getValues('category'))) {
        form.setValue('category', newCategory, { shouldValidate: true });
      }
    }
  }, [suggestedCategory, form, isEditMode]);

  const handleCategorize = async () => {
    if (!descriptionValue) {
      toast({ title: "Categorization Hint", description: "Please enter a description to get an AI category suggestion.", variant: "default" });
      return;
    }
    setIsCategorizing(true);
    setSuggestedCategory(null);
    try {
      const result = await categorizeTransaction({ description: descriptionValue });
      setSuggestedCategory(result); 
      toast({ title: "AI Suggestion", description: `Suggested category: ${result.category} (Confidence: ${(result.confidence * 100).toFixed(0)}%)`, variant: "default" });
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      toast({ title: "AI Error", description: "Could not get category suggestion.", variant: "destructive" });
    } finally {
      setIsCategorizing(false);
    }
  };
  
  const onSubmit = async (data: TransactionFormData) => {
    const submissionData: Omit<Transaction, 'id' | 'userId' | 'date'> & { date: Date | string, recurrenceEndDate?: string | null } = {
      ...data,
      date: data.date, // Will be formatted to string in context
      recurrenceFrequency: data.isRecurring ? data.recurrenceFrequency : 'none',
      recurrenceEndDate: data.isRecurring && data.recurrenceEndDate ? format(data.recurrenceEndDate, 'yyyy-MM-dd') : null,
    };

    if (!data.isRecurring) {
        submissionData.recurrenceFrequency = 'none';
        submissionData.recurrenceEndDate = null;
    }


    if (isEditMode && initialData?.id) {
      await updateTransaction(initialData.id, submissionData);
    } else {
      await addTransaction(submissionData);
    }
    setSuggestedCategory(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{isEditMode ? 'Edit Transaction' : 'Add New Transaction'}</CardTitle>
        <CardDescription>{isEditMode ? 'Update the details of your transaction.' : 'Log your income and expenses manually.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="flex items-center gap-2">
              <Input id="description" {...form.register('description')} placeholder="e.g., Groceries, Salary" className="flex-grow"/>
              <Button type="button" onClick={handleCategorize} disabled={isCategorizing || !descriptionValue} variant="outline" size="icon" className="shrink-0">
                {isCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-accent" />}
                <span className="sr-only">Get AI Category Suggestion</span>
              </Button>
            </div>
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" type="number" step="0.01" {...form.register('amount')} placeholder="0.00" />
            {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} value={field.value} defaultValue={field.value} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" />
                    <Label htmlFor="income">Income</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" />
                    <Label htmlFor="expense">Expense</Label>
                  </div>
                </RadioGroup>
              )}
            />
            {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
          </div>
          
          {/* Date */}
           <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Controller
                name="date"
                control={form.control}
                render={({ field }) => (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => field.onChange(date)}
                                initialFocus
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            />
                        </PopoverContent>
                    </Popover>
                )}
            />
            {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
            {suggestedCategory && (
              <p className="text-xs text-muted-foreground mt-1">
                AI Suggestion: {suggestedCategory.category} (Confidence: {(suggestedCategory.confidence * 100).toFixed(0)}%)
              </p>
            )}
          </div>

          {/* Recurring Transaction */}
          <div className="space-y-4 pt-2 border-t border-border">
             <Controller
                name="isRecurring"
                control={form.control}
                render={({ field }) => (
                    <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                            id="isRecurring"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="isRecurring" className="font-medium">
                            This is a recurring transaction
                        </Label>
                    </div>
                )}
            />
            {isRecurringValue && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="recurrenceFrequency">Frequency</Label>
                        <Controller
                            control={form.control}
                            name="recurrenceFrequency"
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                                    <SelectTrigger id="recurrenceFrequency">
                                        <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" disabled>Select frequency</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {form.formState.errors.recurrenceFrequency && <p className="text-sm text-destructive">{form.formState.errors.recurrenceFrequency.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recurrenceEndDate">End Date (Optional)</Label>
                        <Controller
                            name="recurrenceEndDate"
                            control={form.control}
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick an end date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={(date) => field.onChange(date)}
                                            disabled={(date) => date < form.getValues('date') || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                         {form.formState.errors.recurrenceEndDate && <p className="text-sm text-destructive">{form.formState.errors.recurrenceEndDate.message}</p>}
                    </div>
                </>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
