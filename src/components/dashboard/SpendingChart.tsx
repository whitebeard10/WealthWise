'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTransactions } from '@/contexts/TransactionContext';
import type { SpendingByCategory } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  amount: {
    label: "Amount ($)",
    color: "hsl(var(--primary))",
  },
} satisfies Record<string, any>;


export function SpendingChart() {
  const { transactions, loading } = useTransactions();

  const spendingData: SpendingByCategory[] = useMemo(() => {
    if (loading) return [];
    const expensesByCat = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(expensesByCat)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount) // Sort by amount descending
      .slice(0, 7); // Show top 7 categories
  }, [transactions, loading]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending Patterns</CardTitle>
          <CardDescription>Your top spending categories.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (spendingData.length === 0 && !loading) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending Patterns</CardTitle>
           <CardDescription>Your top spending categories.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No expense data available to display chart.</p>
          <p className="text-sm text-muted-foreground">Add some expenses to see your spending patterns.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Spending Patterns</CardTitle>
        <CardDescription>Your top spending categories this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendingData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="category" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
