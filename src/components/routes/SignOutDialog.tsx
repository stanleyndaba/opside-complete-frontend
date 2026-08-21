import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setIsSigningOut(false);
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSigningOut) return;
    onOpenChange(nextOpen);
  };

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);

    try {
      await signOut();
      queryClient.clear();
      window.location.replace('/');
    } catch (signOutError) {
      setError(signOutError instanceof Error
        ? signOutError.message
        : 'Margin could not sign this browser out. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-0 shadow-[0_18px_45px_rgba(24,32,38,0.16)] sm:max-w-[420px]">
        <DialogHeader className="border-b border-[#DCE8EE] px-5 py-5 text-left sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#DCE8EE] bg-[#FAFAF7] text-[#182026]">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <DialogTitle className="font-lora text-[21px] font-normal tracking-tight text-[#182026]">Sign out</DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] font-medium tracking-tight text-[#66737F]">End this browser session</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 sm:px-6">
          <p className="text-[14px] leading-6 text-[#4D5B66]">
            Signing out ends this browser’s authenticated Margin session. Your workspace and saved activity are not deleted, and protected access will require you to sign in again.
          </p>
          {error && (
            <p role="alert" className="mt-4 rounded-md border border-[#E9CDD4] bg-[#FFF8F9] px-3 py-2 text-[12px] leading-5 text-[#8B4050]">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex gap-3 border-t border-[#DCE8EE] bg-[#FAFAF7] px-5 py-4 sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={isSigningOut}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-md border-[#DCE8EE] bg-white px-4 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            className="h-9 rounded-md border border-[#D1D9DE] bg-[#E9EEF1] px-4 text-[13px] font-medium tracking-tight text-[#182026] hover:bg-[#DDE5E9] hover:text-[#111827]"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SignOutDialog;
