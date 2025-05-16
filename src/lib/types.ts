export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO string format (e.g., "2023-10-26")
  category: string;
}

export interface FinancialSummaryData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  fill?: string; // For chart color
}
