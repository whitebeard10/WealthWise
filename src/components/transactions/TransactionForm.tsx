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
import { CalendarIcon, Loader2, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/contexts/TransactionContext';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction';
import type { CategorizeTransactionOutput } from '@/ai/flows/categorize-transaction';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  date: z.date({ required_error: "A date is required."}),
  category: z.string().min(1, 'Category is required'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const defaultCategories = [
  "Food & Drinks", "Shopping", "Housing", "Transportation", "Vehicle",
  "Life & Entertainment", "Communication & PC", "Financial Expenses",
  "Investments", "Income", "Others"
];

export function TransactionForm() {
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<CategorizeTransactionOutput | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(defaultCategories);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      type: 'expense',
      date: new Date(),
      category: '',
    },
  });

  const descriptionValue = form.watch('description');

  useEffect(() => {
    if (suggestedCategory?.category && !availableCategories.includes(suggestedCategory.category)) {
      setAvailableCategories(prev => [...prev, suggestedCategory.category!]);
    }
    if(suggestedCategory?.category) {
      form.setValue('category', suggestedCategory.category, { shouldValidate: true });
    }
  }, [suggestedCategory, availableCategories, form]);

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
  
  const onSubmit = (data: TransactionFormData) => {
    addTransaction({
      ...data,
      date: format(data.date, 'yyyy-MM-dd'), // Store date as string
    });
    toast({ title: "Success!", description: "Transaction added successfully.", variant: "default" });
    form.reset();
    setSuggestedCategory(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Add New Transaction</CardTitle>
        <CardDescription>Log your income and expenses manually.</CardDescription>
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
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
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
                                onSelect={field.onChange}
                                initialFocus
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
          
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
