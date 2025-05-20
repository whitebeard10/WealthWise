
export interface Transaction {
  id: string; // Firestore document ID
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string; // ISO string format (e.g., "2023-10-26")
  category: string;
  userId?: string; // To associate with the authenticated user
  isRecurring?: boolean;
  recurrenceFrequency?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEndDate?: string | null; // yyyy-MM-dd format, or null if no end date
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

export interface Budget {
  id: string; // Firestore document ID
  userId: string;
  category: string;
  allocatedAmount: number;
  month: string; // Format "YYYY-MM", e.g., "2024-07"
}

// For form data, ID might be optional if creating new
export type BudgetFormData = Omit<Budget, 'id' | 'userId'> & {
  id?: string;
};
