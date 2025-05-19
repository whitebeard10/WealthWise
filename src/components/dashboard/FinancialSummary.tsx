
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/contexts/TransactionContext";
import type { FinancialSummaryData } from "@/lib/types";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import React, { useMemo } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
  delay?: number;
  isNetBalance?: boolean;
}

function SummaryCard({ title, value, icon: Icon, isLoading, delay = 0, isNetBalance = false }: SummaryCardProps) {
  const valueColorClass = isNetBalance ? (value >= 0 ? 'text-primary' : 'text-destructive') : 'text-foreground';

  return (
    <Card
      className="shadow-lg hover:shadow-xl transition-shadow duration-300 fade-in-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded-md"></div>
        ) : (
          <div className={`text-2xl font-bold ${valueColorClass}`}>
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
    <>
      <style jsx global>{`
        .fade-in-card {
          opacity: 0;
          animation: fadeIn 0.5s ease-in-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="Total Income" value={summaryData.totalIncome} icon={TrendingUp} isLoading={loading} delay={0} />
        <SummaryCard title="Total Expenses" value={summaryData.totalExpenses} icon={TrendingDown} isLoading={loading} delay={100} />
        <SummaryCard title="Net Balance" value={summaryData.netBalance} icon={Scale} isLoading={loading} delay={200} isNetBalance={true} />
      </div>
    </>
  );
}
