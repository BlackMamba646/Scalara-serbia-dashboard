"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  Target,
  Building2,
  Signal,
  ShieldCheck,
  Newspaper,
  Users,
  Mail,
  Kanban,
  Database,
  Settings,
  BarChart3,
  CheckSquare,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { ScalaraLogo } from "@/components/scalara-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  {
    group: "Intelligence",
    items: [
      { title: "Radar", href: "/", icon: Radar },
      { title: "Opportunities", href: "/opportunities", icon: Target },
      { title: "Companies", href: "/companies", icon: Building2 },
      { title: "Signals", href: "/signals", icon: Signal },
    ],
  },
  {
    group: "Research",
    items: [
      { title: "Licenses", href: "/licenses", icon: ShieldCheck },
      { title: "News", href: "/news", icon: Newspaper },
      { title: "Contacts", href: "/contacts", icon: Users },
    ],
  },
  {
    group: "CRM",
    items: [
      { title: "CRM", href: "/crm", icon: LayoutDashboard },
      { title: "Tasks", href: "/tasks", icon: CheckSquare },
      { title: "Meetings", href: "/meetings", icon: Calendar },
      { title: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    group: "Sales",
    items: [
      { title: "Outreach", href: "/outreach", icon: Mail },
      { title: "Pipeline", href: "/pipeline", icon: Kanban },
    ],
  },
  {
    group: "System",
    items: [
      { title: "Sources", href: "/sources", icon: Database },
      { title: "Admin", href: "/admin", icon: BarChart3 },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <ScalaraLogo className="h-8 w-8 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Scalara Radar
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              iGaming Intelligence
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
