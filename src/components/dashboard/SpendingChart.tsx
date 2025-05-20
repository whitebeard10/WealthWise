
'use client';

import React, { useMemo, useState } from 'react';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTransactions } from '@/contexts/TransactionContext';
import type { SpendingByCategory } from '@/lib/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, BarChartBig, PieChartIcon, LineChartIcon } from 'lucide-react'; // Added new icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define a consistent chartConfig for all chart types
const chartConfig = {
  amount: {
    label: "Amount ($)",
    color: "hsl(var(--primary))",
  },
  // Add other categories if needed, for pie chart colors primarily
  // For simplicity, we'll define a COLORS array for pie chart directly
} satisfies Record<string, any>;

const PIE_CHART_COLORS = [
  'hsl(var(--chart-1))', 
  'hsl(var(--chart-2))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted))', // Fallback color
  'hsl(var(--secondary))' // Fallback color
];


export function SpendingChart() {
  const { transactions, loading } = useTransactions();
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'pie' | 'line'>('bar');

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

  const pieChartData = useMemo(() => {
    return spendingData.map(item => ({ name: item.category, value: item.amount }));
  }, [spendingData]);

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Spending Patterns</CardTitle>
          <CardDescription>Analyzing your top spending categories...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" /> {/* Adjusted height for tabs */}
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
        <CardContent className="flex flex-col items-center justify-center h-[350px] space-y-4"> {/* Adjusted height */}
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
        <CardDescription>Your top spending categories. Select a chart type below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" onValueChange={(value) => setSelectedChartType(value as any)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="bar" className="flex items-center gap-2">
              <BarChartBig className="h-4 w-4" /> Bar Chart
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" /> Pie Chart
            </TabsTrigger>
            <TabsTrigger value="line" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" /> Line Chart
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'bar' && (
              <BarChart data={spendingData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="category" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value) => {
                      if (typeof value === 'number') {
                          return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                      return value;
                  }} />}
                />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={8} animationBegin={800} animationDuration={800} />
              </BarChart>
            )}

            {selectedChartType === 'pie' && (
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                              nameKey="name" 
                              hideLabel 
                              formatter={(value, name, item) => {
                                  return (
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.payload.name}</span>
                                      <span className="text-muted-foreground">
                                        ${(item.payload.value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )
                              }}
                            />
                        }
                />
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  // label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  //   const RADIAN = Math.PI / 180;
                  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  //   return (
                  //     <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  //       {`${(percent * 100).toFixed(0)}%`}
                  //     </text>
                  //   );
                  // }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            )}

            {selectedChartType === 'line' && (
              <LineChart data={spendingData} margin={{ top: 5, right: 20, left: -20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis 
                  dataKey="category" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={60}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value) => {
                      if (typeof value === 'number') {
                          return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                      return value;
                  }} />}
                />
                <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
