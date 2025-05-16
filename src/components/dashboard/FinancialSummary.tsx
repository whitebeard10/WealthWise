'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionContext";
import type { FinancialSummaryData } from "@/lib/types";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, PiggyBank, TrendingUp, TrendingDown, Scale } from "lucide-react";
import React, { useMemo } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
}

function SummaryCard({ title, value, icon: Icon, isLoading }: SummaryCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className="text-2xl font-bold">
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinancialSummary() {
  const { transactions, loading } = useTransactions();

  const summaryData: FinancialSummaryData = useMemo(() => {
    const data = transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'income') {
          acc.totalIncome += curr.amount;
        } else {
          acc.totalExpenses += curr.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    );
    data.netBalance = data.totalIncome - data.totalExpenses;
    return data;
  }, [transactions]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryCard title="Total Income" value={summaryData.totalIncome} icon={TrendingDown} isLoading={loading} />
      <SummaryCard title="Total Expenses" value={summaryData.totalExpenses} icon={TrendingUp} isLoading={loading} />
      <SummaryCard title="Net Balance" value={summaryData.netBalance} icon={Scale} isLoading={loading} />
    </div>
  );
}
