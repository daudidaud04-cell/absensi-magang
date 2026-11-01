import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export type NavEntry = {
    title: string;
    icon: LucideIcon;
    href?: NavItem['href']; // menu tunggal
    items?: NavItem[]; // dropdown
};

export function NavGroups({ entries }: { entries: NavEntry[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarMenu className="gap-2">
                {entries.map((e) => {
                    // Menu tunggal
                    if (!e.items) {
                        return (
                            <SidebarMenuItem key={e.title}>
                                <SidebarMenuButton
                                    asChild
                                    size="lg"
                                    isActive={isCurrentUrl(e.href!)}
                                    tooltip={{ children: e.title }}
                                    className="h-12 gap-3 text-[15px]"
                                >
                                    <Link href={e.href!} prefetch>
                                        <e.icon />
                                        <span className="font-medium">{e.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    // Dropdown: terbuka secara bawaan
                    return (
                        <Collapsible key={e.title} defaultOpen className="group/collapsible">
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        tooltip={{ children: e.title }}
                                        className="h-12 gap-3 text-[15px]"
                                    >
                                        <e.icon />
                                        <span className="font-medium">{e.title}</span>
                                        <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub className="mx-0 gap-1.5 border-l-0 px-0 py-2">
                                        {e.items.map((item) => (
                                            <SidebarMenuSubItem key={item.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(item.href)}
                                                    className="h-10 gap-3 pl-9 [&_svg]:!text-current"
                                                >
                                                    <Link href={item.href} prefetch>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}