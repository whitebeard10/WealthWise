
'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTransactions } from '@/contexts/TransactionContext';
import type { SpendingByCategory } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

const chartConfig = {
  amount: {
    label: "Amount (₹)", // Note: The currency symbol here might need to be dynamic or match user's locale
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
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7); 
  }, [transactions, loading]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending Patterns</CardTitle>
          <CardDescription>Analyzing your top spending categories...</CardDescription>
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
           <CardDescription>Your top spending categories will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] space-y-4">
          <p className="text-lg text-muted-foreground">No expense data yet to show spending patterns.</p>
          <p className="text-sm text-muted-foreground">Start by adding some expenses to see your habits!</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/transactions/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add First Expense
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Spending Patterns</CardTitle>
        <CardDescription>Your top spending categories.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spendingData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}> {/* Increased bottom margin for angled labels */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="category" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8}
                angle={-45} // Angle labels for better readability
                textAnchor="end" // Anchor angled labels at their end
                interval={0} // Ensure all labels are shown
                height={60} // Allocate more height for angled labels
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel formatter={(value, name, props) => {
                    if (props.payload && typeof value === 'number') {
                        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                    return value;
                }} />}
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={8} animationBegin={800} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
