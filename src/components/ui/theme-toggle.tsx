import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string;
}

export function ThemeToggle({ collapsed = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={toggleTheme}
          className={cn(
            "transition-all duration-200",
            collapsed 
              ? "h-9 w-9" 
              : "w-full justify-start gap-3 px-3",
            className
          )}
        >
          {isLight ? (
            <Moon className="h-4 w-4 shrink-0" />
          ) : (
            <Sun className="h-4 w-4 shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm">
              {isLight ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      {collapsed && (
        <TooltipContent side="right" sideOffset={10}>
          {isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
