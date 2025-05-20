
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from "@/components/ui/toaster";
import { TransactionProvider } from '@/contexts/TransactionContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { BudgetProvider } from '@/contexts/BudgetContext'; // Import BudgetProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WealthWise - Smart Finance Tracking',
  description: 'Track your finances intelligently with WealthWise.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <TransactionProvider>
            <BudgetProvider> {/* Wrap with BudgetProvider */}
              <AppLayout>
                {children}
              </AppLayout>
            </BudgetProvider>
          </TransactionProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
