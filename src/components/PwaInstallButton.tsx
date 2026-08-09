import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { promptPwaInstall, subscribeToPwaInstall } from '@/lib/pwaInstall';

type PwaInstallButtonProps = {
  className?: string;
  label?: string;
};

export function PwaInstallButton({ className, label = 'Install Margin Desktop' }: PwaInstallButtonProps) {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    return subscribeToPwaInstall(({ canInstall }) => {
      setIsInstallable(canInstall);
    });
  }, []);

  const handleInstallClick = async () => {
    await promptPwaInstall();
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstallClick}
      className={cn("inline-flex items-center gap-2 px-0 text-white/70 hover:bg-transparent hover:text-white", className)}
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
