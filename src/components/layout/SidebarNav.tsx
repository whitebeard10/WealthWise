
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LayoutDashboard, PlusCircle, TrendingUp, UserCircle, LogOut } from 'lucide-react'; // Removed LogIn, UserPlus
import { useAuth } from '@/contexts/AuthContext';

export function SidebarNav() {
  const pathname = usePathname();
  const { currentUser, logOut, loading: authLoading } = useAuth();

  // Nav items are now only for authenticated users.
  // The "Dashboard" link is common but will only be shown when SidebarNav is rendered (i.e., user is logged in).
  const authenticatedNavItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions/add', label: 'Add Transaction', icon: PlusCircle },
    { href: '/forecast', label: 'AI Forecast', icon: TrendingUp },
    { href: '/profile', label: 'Profile', icon: UserCircle },
    // { href: '/settings', label: 'Settings', icon: Settings }, // Example for future
  ];
  
  // If auth is loading, or no user, this component might not be rendered due to AppLayout changes,
  // but if it were, we'd show nothing or a skeleton. For simplicity, return null if no user.
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
      {/* Logout button remains for authenticated users */}
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
