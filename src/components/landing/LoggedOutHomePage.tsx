
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, LogIn, UserPlus } from 'lucide-react';

export function LoggedOutHomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <Card className="w-full max-w-lg text-center shadow-2xl animate-fadeInUp">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center justify-center mb-4">
            <Leaf className="h-16 w-16 text-primary mb-3" />
            <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
              Welcome to WealthWise
            </CardTitle>
          </div>
          <CardDescription className="text-lg text-muted-foreground px-2">
            Your intelligent solution for tracking finances, understanding spending patterns, and forecasting your financial future with AI-powered insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <p className="text-md text-foreground/90">
            Take control of your financial journey. Log your transactions, visualize your expenses, and let our AI help you plan ahead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="flex-1 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="flex-1 shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                <UserPlus className="mr-2 h-5 w-5" /> Sign Up
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
