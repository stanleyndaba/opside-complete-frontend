import React, { useState } from 'react';
import { Bell, DollarSign, CheckCircle, FileCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface RecentNotification {
  id: string;
  icon: React.ElementType;
  message: string;
  timestamp: string;
  href?: string;
  read: boolean;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState<RecentNotification[]>([
    {
      id: '1',
      icon: DollarSign,
      message: 'Payout of $75.50 confirmed',
      timestamp: '2h ago',
      href: '/recoveries',
      read: false
    },
    {
      id: '2',
      icon: CheckCircle,
      message: 'New recovery guaranteed: $125.00',
      timestamp: '1d ago',
      href: '/recoveries',
      read: false
    },
    {
      id: '3',
      icon: FileCheck,
      message: 'Invoice processed successfully',
      timestamp: '2d ago',
      href: '/evidence-locker',
      read: true
    },
    {
      id: '4',
      icon: Users,
      message: 'Sarah Johnson joined your team',
      timestamp: '3d ago',
      href: '/team-management',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = () => {
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 hover:bg-muted/50"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <>
              {/* Pulsing effect */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
              {/* Static dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                {unreadCount > 9 ? (
                  <span className="text-[8px] font-bold text-destructive-foreground">9+</span>
                ) : (
                  <span className="text-[8px] font-bold text-destructive-foreground">{unreadCount}</span>
                )}
              </div>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto bg-background border border-border shadow-lg z-50"
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="py-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification, index) => {
              const IconComponent = notification.icon;
              const content = (
                <div 
                  className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                  onClick={handleNotificationClick}
                >
                  <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                    !notification.read ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <IconComponent className={`w-3 h-3 ${
                      !notification.read ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${
                      !notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                  )}
                </div>
              );

              return (
                <React.Fragment key={notification.id}>
                  {notification.href ? (
                    <Link to={notification.href}>
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                  {index < notifications.length - 1 && (
                    <DropdownMenuSeparator className="my-0" />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Link to="/notifications" onClick={handleNotificationClick}>
            <Button 
              variant="ghost" 
              className="w-full justify-center text-xs h-8 hover:bg-muted/50"
            >
              View All Notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}