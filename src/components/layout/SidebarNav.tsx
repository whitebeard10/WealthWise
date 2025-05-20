
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, TrendingUp, UserCircle, LogOut, Target } from 'lucide-react'; // Added Target
import { useAuth } from '@/contexts/AuthContext';

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logOut, loading: authLoading } = useAuth();

  const authenticatedNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions/add', label: 'Add Transaction', icon: PlusCircle },
    { href: '/budgets', label: 'Budgets', icon: Target }, // New Budgets link
    { href: '/forecast', label: 'AI Forecast', icon: TrendingUp },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ];
  
  if (authLoading || !currentUser) { 
      return null; 
  }

  return (
    <SidebarMenu>
      {authenticatedNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href === '/budgets' && pathname.startsWith('/budgets'))} // Highlight for /budgets and subpaths
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
    </SidebarMenu>
  );
}
