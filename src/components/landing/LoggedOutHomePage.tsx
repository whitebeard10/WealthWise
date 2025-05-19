
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, LogIn, UserPlus } from 'lucide-react';

export function LoggedOutHomePage() {
  return (
    <>
      <div 
        className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-cover bg-center bg-no-repeat"
        data-ai-hint="finance abstract"
      >
        {/* Background Image and Overlay */}
        <div 
          className="absolute inset-0 bg-center bg-cover z-0" 
          style={{ backgroundImage: "url('https://placehold.co/1920x1080/264A32/F0F7F1.png?text=WealthWise+Background')" }} 
          data-ai-hint="modern abstract"
        />
        <div className="absolute inset-0 bg-black/60 z-0"></div> {/* Dark overlay */}

        <Card className="w-full max-w-lg text-center shadow-2xl z-10 animate-fadeInUp bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center justify-center mb-4">
              <Leaf className="h-20 w-20 text-primary mb-3 animate-scalePulse" />
              <CardTitle className="text-5xl font-bold tracking-tight text-foreground animate-contentFadeInUp" style={{ animationDelay: '0.2s' }}>
                Welcome to WealthWise
              </CardTitle>
            </div>
            <CardDescription className="text-xl text-muted-foreground px-2 animate-contentFadeInUp" style={{ animationDelay: '0.4s' }}>
              Your intelligent partner for seamless finance tracking, insightful spending analysis, and AI-powered financial forecasting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <p className="text-lg text-foreground/90 animate-contentFadeInUp" style={{ animationDelay: '0.6s' }}>
              Take command of your financial journey. Effortlessly log transactions, visualize your expenses, and plan for a prosperous future with our smart tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                asChild 
                size="lg" 
                className="flex-1 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 animate-contentFadeInUp" 
                style={{ animationDelay: '0.8s' }}
              >
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" /> Login
                </Link>
              </Button>
              <Button 
                asChild 
                variant="secondary" 
                size="lg" 
                className="flex-1 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 animate-contentFadeInUp" 
                style={{ animationDelay: '0.9s' }}
              >
                <Link href="/signup">
                  <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        @keyframes contentFadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-contentFadeInUp {
          opacity: 0; /* Start hidden */
          animation: contentFadeInUp 0.5s ease-out forwards;
        }
        
        @keyframes scalePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        .animate-scalePulse {
          animation: scalePulse 2s infinite ease-in-out, contentFadeInUp 0.5s ease-out forwards;
           opacity: 0; /* Start hidden for fadeIn */
           animation-delay: 0s, 0.1s; /* Delay for fadeIn part of combined animation */
        }
      `}</style>
    </>
  );
}
