
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { format } from 'date-fns';
import { User, Mail, CalendarDays, ListChecks, LogOut, Fingerprint, Edit3, TrendingUp, KeyRound, Download } from 'lucide-react'; // Added Download
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function ProfilePage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const router = useRouter();
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || transactionsLoading || !currentUser) {
    return <Loading />;
  }

  const memberSince = currentUser.metadata.creationTime
    ? format(new Date(currentUser.metadata.creationTime), 'MMMM dd, yyyy')
    : 'N/A';

  const totalTransactions = transactions.length;

  // Placeholder for edit profile functionality
  const handleEditProfile = () => {
    // In a real app, this would navigate to an edit profile page or open a modal
    toast({ title: "Coming Soon!", description: "Edit profile functionality is under development." });
  };

  const convertToCSV = (data: typeof transactions) => {
    if (data.length === 0) return "";
    const replacer = (key: string, value: any) => value === null || value === undefined ? '' : value;
    const header = Object.keys(data[0]).filter(key => key !== 'userId').join(','); // Exclude userId from header
    const rows = data.map(row =>
      Object.keys(row)
        .filter(key => key !== 'userId') // Exclude userId from data rows
        .map(fieldName => JSON.stringify((row as any)[fieldName], replacer))
        .join(',')
    );
    return [header, ...rows].join('\r\n');
  };

  const handleExportTransactions = () => {
    if (transactions.length === 0) {
      toast({
        title: "No Transactions",
        description: "There are no transactions to export.",
        variant: "default",
      });
      return;
    }

    try {
      const csvString = convertToCSV(transactions);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const fileName = `wealthwise_transactions_${currentUser.uid}_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Export Successful",
        description: `Transactions exported to ${fileName}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast({
        title: "Export Failed",
        description: "Could not export transactions. Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Overview</h1>
        <Button onClick={logOut} variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>
      <Separator />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mt-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-6 w-6 text-primary" />
              Account Information
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleEditProfile} className="text-muted-foreground hover:text-primary">
              <Edit3 className="h-5 w-5" />
              <span className="sr-only">Edit Profile</span>
            </Button>
          </CardHeader>
          <CardDescription className="px-6 pb-2">Your personal and account details.</CardDescription>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <CalendarDays className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                <p className="text-sm font-semibold">{memberSince}</p>
              </div>
            </div>
             <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <Fingerprint className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">User ID</p>
                <p className="text-xs text-foreground break-all">{currentUser.uid}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <KeyRound className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Security</p>
                <Link href="/profile/change-password" passHref>
                  <Button variant="link" className="p-0 h-auto text-sm font-semibold text-primary hover:underline">
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListChecks className="h-6 w-6 text-primary" />
              Activity Summary
            </CardTitle>
            <CardDescription>A quick look at your app usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <ListChecks className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Transactions Logged</p>
                <p className="text-sm font-semibold">{totalTransactions}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors opacity-50 cursor-not-allowed">
                <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div>
                    <p className="text-xs font-medium text-muted-foreground">AI Forecasts Generated</p>
                    <p className="text-sm font-semibold">0 (Feature coming soon!)</p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Download className="h-6 w-6 text-primary" /> 
              Data Management
            </CardTitle>
            <CardDescription>Export your financial data.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button onClick={handleExportTransactions} className="w-full shadow-md hover:shadow-lg transition-shadow">
              <Download className="mr-2 h-4 w-4" />
              Export Transactions (CSV)
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
