
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
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const { currentUser, loading } = useAuth();

  // Do not render layout if auth is loading and no user, to prevent flash of unauth state
  // However, login/signup pages should render immediately.
  // This logic might need refinement based on specific public/private page handling.
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAuthPage = path === '/login' || path === '/signup';

  if (loading && !currentUser && !isAuthPage) {
     // You might want a global loading spinner here, or handle it in individual pages.
     // For now, returning null or a minimal loader can prevent layout flash.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {/* Minimal loader to avoid full layout flash */}
      </div>
    );
  }


  // If there's no current user and we are not on an auth page,
  // SidebarNav will render Login/Signup.
  // If on an auth page, children will render the auth form.
  // The Sidebar and header are still rendered for auth pages for consistency.

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
        {/* Footer can be used for other things, or removed if profile button is fully handled by SidebarNav */}
        <SidebarFooter className="p-4 mt-auto">
          {/* Example: Theme switcher or other global actions could go here */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden" />
          {/* Could add breadcrumbs or page title here */}
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
