
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, TrendingUp, Settings, UserCircle, LogIn, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logOut, loading } = useAuth();

  const commonNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: false },
  ];

  const authenticatedNavItems = [
    ...commonNavItems,
    { href: '/transactions/add', label: 'Add Transaction', icon: PlusCircle, requiresAuth: true },
    { href: '/forecast', label: 'AI Forecast', icon: TrendingUp, requiresAuth: true },
    { href: '/profile', label: 'Profile', icon: UserCircle, requiresAuth: true },
    // { href: '/settings', label: 'Settings', icon: Settings, requiresAuth: true },
  ];

  const unauthenticatedNavItems = [
    ...commonNavItems,
    { href: '/login', label: 'Login', icon: LogIn, requiresAuth: false },
    { href: '/signup', label: 'Sign Up', icon: UserPlus, requiresAuth: false },
  ];
  
  let navItems = [];
  if (loading) { // Don't render nav items if auth state is loading, or render skeleton
      navItems = [];
  } else if (currentUser) {
      navItems = authenticatedNavItems;
  } else {
      navItems = unauthenticatedNavItems;
  }


  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={{ children: item.label, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
      {currentUser && !loading && (
        <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => { await logOut(); }}
              tooltip={{ children: "Logout", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
