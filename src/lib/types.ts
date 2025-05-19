
export interface Transaction {
  id: string; // Firestore document ID
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO string format (e.g., "2023-10-26")
  category: string;
  userId?: string; // To associate with the authenticated user
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
