
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/app/loading';
import { format } from 'date-fns';
import { User, Mail, CalendarDays, ListChecks, LogOut, Fingerprint } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const router = useRouter();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <Button onClick={logOut} variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow">
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"> {/* Adjusted grid for better responsiveness */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Your personal and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2"> {/* Added pt-2 for better spacing */}
            <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Mail className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-md font-semibold">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <CalendarDays className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Member Since</p>
                <p className="text-md font-semibold">{memberSince}</p>
              </div>
            </div>
             <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <Fingerprint className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">User ID</p>
                <p className="text-xs text-foreground break-all">{currentUser.uid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-primary" />
              Activity Summary
            </CardTitle>
            <CardDescription>A quick look at your app usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2"> {/* Added pt-2 */}
            <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <ListChecks className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Transactions Logged</p>
                <p className="text-md font-semibold">{totalTransactions}</p>
              </div>
            </div>
            {/* You can add more summary items here in the future */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
