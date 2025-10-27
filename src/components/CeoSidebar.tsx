import { Home, Users, Coffee, Calendar, Building, TrendingUp, DollarSign, BarChart3, UserCog, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/ceo", icon: Home, end: true },
  { title: "Reception", url: "/ceo/reception", icon: Users },
  { title: "Barista", url: "/ceo/barista", icon: Coffee },
  { title: "Community", url: "/ceo/community", icon: Calendar },
  { title: "Operations", url: "/ceo/operations", icon: Building },
  { title: "CRM", url: "/ceo/crm", icon: TrendingUp },
  { title: "Finance", url: "/ceo/finance", icon: DollarSign },
];

const managementItems = [
  { title: "Analytics", url: "/ceo/analytics", icon: BarChart3 },
  { title: "KPIs", url: "/ceo/kpis", icon: TrendingUp },
  { title: "Roles", url: "/ceo/roles", icon: UserCog },
  { title: "Settings", url: "/ceo/settings", icon: Settings },
];

export function CeoSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string, end?: boolean) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getNavCls = (path: string, end?: boolean) =>
    isActive(path, end)
      ? "bg-primary/10 text-primary font-medium border-l-4 border-primary"
      : "hover:bg-muted/50";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        <div className="p-4">
          {!collapsed && (
            <div className="mb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CEO Dashboard
              </h2>
              <p className="text-xs text-muted-foreground">Full System Access</p>
            </div>
          )}
          <SidebarTrigger className="mb-2" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Portal Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={getNavCls(item.url, item.end)}
                    >
                      <item.icon className="h-5 w-5 min-w-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavCls(item.url)}
                    >
                      <item.icon className="h-5 w-5 min-w-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
