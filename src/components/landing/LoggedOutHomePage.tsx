
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, LogIn, UserPlus } from 'lucide-react';

const CustomBackgroundSVG = () => (
  <svg 
    width="100%" 
    height="100%" 
    viewBox="0 0 1920 1080" 
    preserveAspectRatio="xMidYMid slice" 
    xmlns="http://www.w3.org/2000/svg"
    className="absolute inset-0 z-0"
  >
    <defs>
      <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(140, 28%, 34%)', stopOpacity: 0.25 }} />
        <stop offset="100%" style={{ stopColor: 'hsl(45, 65%, 52%)', stopOpacity: 0.1 }} />
      </linearGradient>
      <linearGradient id="bgGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'hsl(140, 28%, 40%)', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: 'hsl(130, 33%, 85%)', stopOpacity: 0.05 }} />
      </linearGradient>
      <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="50" />
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="hsl(130, 33%, 92%)" />
    
    <path d="M-200,700 C300,400 500,1000 800,600 S1100,200 1400,500 S1700,900 2120,500 L2120,1080 L-200,1080 Z" fill="url(#bgGrad1)" opacity="0.7"/>
    <path d="M2120,300 C1800,600 1600,0 1300,400 S1000,800 700,400 S400,0 -200,400 L-200,0 L2120,0 Z" fill="url(#bgGrad2)" opacity="0.6"/>

    <circle cx="15%" cy="20%" r="250" fill="hsl(140, 28%, 34%)" opacity="0.08" filter="url(#softBlur)" />
    <circle cx="85%" cy="75%" r="350" fill="hsl(45, 65%, 52%)" opacity="0.06" filter="url(#softBlur)" />
    <circle cx="50%" cy="50%" r="200" fill="hsl(130, 33%, 92%)" opacity="0.1" filter="url(#softBlur)" />
    <circle cx="5%" cy="80%" r="180" fill="hsl(140, 28%, 34%)" opacity="0.05" filter="url(#softBlur)" />
    <circle cx="95%" cy="10%" r="150" fill="hsl(45, 65%, 52%)" opacity="0.07" filter="url(#softBlur)" />
  </svg>
);

export function LoggedOutHomePage() {
  return (
    <>
      <div 
        className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-background"
      >
        {/* Custom SVG Background */}
        <CustomBackgroundSVG />
        
        {/* Dark Overlay - on top of SVG, below card */}
        <div className="absolute inset-0 bg-black/50 z-[1]"></div>

        <Card className="w-full max-w-lg text-center shadow-2xl z-[2] animate-fadeInUp bg-card/85 backdrop-blur-md border-border/30">
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
           /* Apply fadeIn part of animation immediately, pulse has its own timing */
           animation-delay: 0s, 0.1s; 
        }
      `}</style>
    </>
  );
}
