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
} from "lucide-react";
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
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Radar className="h-4 w-4" />
          </div>
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

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
