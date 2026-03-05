
'use client';

import React from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

const notificationIcons = {
    alert: <Icons.AlertTriangle className="h-5 w-5 text-destructive" />,
    reminder: <Icons.Clock className="h-5 w-5 text-primary" />,
    info: <Icons.Info className="h-5 w-5 text-blue-500" />
}

export default function NotificationsScreen() {
  const { notifications, clearAllNotifications } = useNotifications();

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
        <Icons.Bell className="h-12 w-12 mb-4" />
        <p className="font-semibold">No notifications yet</p>
        <p className="text-sm">We'll let you know when something comes up.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -mx-6">
      <div className="px-6 py-2 border-b">
        <Button variant="outline" size="sm" className="w-full" onClick={clearAllNotifications}>
          <Icons.Trash className="mr-2 h-4 w-4" />
          Clear All Notifications
        </Button>
      </div>
      <ScrollArea className="flex-1 px-6">
        <div className="flex flex-col gap-4 py-4">
          {notifications.map((notification) => (
            <div key={notification.id} className={cn(
              "flex items-start gap-4 p-3 rounded-lg",
              !notification.read && "bg-accent"
            )}>
              <Avatar className="mt-1">
                  <AvatarFallback className="bg-transparent">
                      {notificationIcons[notification.type]}
                  </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
              </div>
              {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 self-center" title="Unread"></div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
