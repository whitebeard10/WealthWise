'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { forecastExpenses } from '@/ai/flows/forecast-expenses';
import type { ForecastExpensesOutput } from '@/ai/flows/forecast-expenses';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/contexts/TransactionContext'; // Import useTransactions

const forecastSchema = z.object({
  spendingPatterns: z.string().min(10, 'Please provide more details on spending patterns.'),
  financialGoals: z.string().optional(),
});

type ForecastFormData = z.infer<typeof forecastSchema>;

export function ForecastForm() {
  const { toast } = useToast();
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastExpensesOutput | null>(null);
  const { transactions, loading: transactionsLoading } = useTransactions(); // Get transactions

  // Generate spending patterns summary from transactions
  const spendingPatternsSummary = useMemo(() => {
    if (transactionsLoading || transactions.length === 0) {
      return "No transaction data available. Please input manually or add transactions.";
    }
    
    const summaryLines: string[] = [];
    transactions.slice(-20).forEach(t => { // Use last 20 transactions as an example
        summaryLines.push(`${t.date}, ${t.type}, ${t.category}, $${t.amount.toFixed(2)}, ${t.description}`);
    });
    return summaryLines.join('\n') || "Describe your past spending habits, including amounts, categories, and frequency.";
  }, [transactions, transactionsLoading]);


  const form = useForm<ForecastFormData>({
    resolver: zodResolver(forecastSchema),
    defaultValues: {
      spendingPatterns: '', // Will be set by useEffect
      financialGoals: '',
    },
  });

  React.useEffect(() => {
    if (spendingPatternsSummary) {
      form.setValue('spendingPatterns', spendingPatternsSummary);
    }
  }, [spendingPatternsSummary, form]);


  const onSubmit = async (data: ForecastFormData) => {
    setIsForecasting(true);
    setForecastResult(null);
    try {
      const result = await forecastExpenses(data);
      setForecastResult(result);
      toast({ title: "Forecast Generated", description: "AI forecast has been successfully generated.", variant: "default" });
    } catch (error) {
      console.error('Error forecasting expenses:', error);
      toast({ title: "AI Error", description: "Could not generate forecast.", variant: "destructive" });
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">AI-Powered Financial Forecast</CardTitle>
          <CardDescription>Get insights into your future expenses and investment needs based on your financial habits.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="spendingPatterns">Past Spending Patterns</Label>
              <Textarea
                id="spendingPatterns"
                {...form.register('spendingPatterns')}
                placeholder="e.g., Monthly rent: $1500, Groceries: $400/month, Dining out: $200/month..."
                rows={8}
                className="min-h-[150px]"
              />
              {form.formState.errors.spendingPatterns && <p className="text-sm text-destructive">{form.formState.errors.spendingPatterns.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialGoals">Financial Goals (Optional)</Label>
              <Textarea
                id="financialGoals"
                {...form.register('financialGoals')}
                placeholder="e.g., Save for a house down payment in 5 years, Invest in stocks, Retire by 60..."
                rows={4}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isForecasting}>
              {isForecasting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Forecast
            </Button>
          </form>
        </CardContent>
      </Card>

      {forecastResult && (
        <Card className="w-full max-w-3xl mx-auto mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Forecast Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg text-primary">Projected Expenses:</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.projectedExpenses}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-primary">Investment Needs:</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.investmentNeeds}</p>
            </div>
            {forecastResult.recommendations && (
              <div>
                <h3 className="font-semibold text-lg text-primary">Recommendations:</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{forecastResult.recommendations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
