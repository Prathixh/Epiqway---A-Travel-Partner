
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Compass, Map, User } from 'lucide-react';

const navItems = [
  { href: '/planner', label: 'Planner', icon: Compass },
  { href: '/manage-trips', label: 'Trips', icon: Map },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const userInitials = user?.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'U';


  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          
          return (
            <Link
              key={label}
              href={href}
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              {label === 'Profile' ? (
                  <div className="flex flex-col items-center justify-center">
                    <Avatar className={cn('w-6 h-6 mb-1 border-2', isActive ? 'border-primary' : 'border-transparent')}>
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ''} />
                        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </div>
              ) : (
                <Icon
                  className={cn(
                    'w-6 h-6 mb-1',
                    isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                  )}
                />
              )}
              <span
                className={cn(
                  'text-sm',
                  isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
