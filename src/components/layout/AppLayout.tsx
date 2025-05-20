
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarNav } from './SidebarNav';
import { Leaf } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import Loading from '@/app/loading';
import { usePathname } from 'next/navigation'; // Import usePathname

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { currentUser, loading: authLoading } = useAuth();
  
  const pathname = usePathname(); // Use usePathname for consistent path
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';

  // Show full page loader if auth is loading and user is not on an auth page or the public homepage
  if (authLoading && !isAuthPage && pathname !== '/') {
     return <Loading />;
  }

  if (currentUser) {
    // Logged-in layout with sidebar
    return (
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-colors">
              <Leaf className="h-7 w-7 text-sidebar-primary" />
              <span className="group-data-[collapsible=icon]:hidden">WealthWise</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto flex justify-center items-center border-t border-sidebar-border">
            <ThemeToggle />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <SidebarTrigger className="md:hidden" /> {/* For mobile sidebar toggle */}
            {/* Could add breadcrumbs or page title here */}
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    );
  } else {
    // Logged-out layout (applies to /, /login, /signup, /forgot-password or initial auth loading on these pages)
    // No SidebarProvider, no Sidebar, no SidebarInset.
    // The children (e.g., LoggedOutHomePage, LoginForm, SignupForm) will define their own layout and centering.
    return <>{children}</>;
    // The Toaster and global styles are handled by RootLayout, so they will still apply.
  }
}
