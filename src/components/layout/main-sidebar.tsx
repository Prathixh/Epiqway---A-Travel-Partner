
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icons from '@/components/icons';
import { Button } from '../ui/button';
import { Trip } from '@/lib/trip';
import { useUser } from '@/firebase';

interface MainSidebarProps {
  trip: Trip | null;
  onNewTrip: () => void;
}

export default function MainSidebar({ trip, onNewTrip }: MainSidebarProps) {
  const { user, status } = useUser();
  const pathname = usePathname();
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';


  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10" asChild>
            <Link href="/planner">
              <Icons.Compass className="h-6 w-6" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold font-headline">epiqway</h1>
            {trip && <span className="text-xs text-muted-foreground">{trip.destination}</span>}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/planner'}>
              <Link href="/planner">
                <Icons.Plane />
                Planner
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={pathname === '/manage-trips'}>
              <Link href="/manage-trips">
                <Icons.Map />
                Manage Trips
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton asChild isActive={pathname === '/profile'}>
              <Link href="/profile">
                <Icons.User />
                Profile
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2 rounded-lg">
          {user && (
            <Avatar>
              <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
