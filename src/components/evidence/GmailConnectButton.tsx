import React from 'react';
import { Button } from '@/components/ui/button';
import { gmailApi } from '@/lib/gmailApi';

interface GmailConnectButtonProps {
  onConnected?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

const GmailConnectButton: React.FC<GmailConnectButtonProps> = ({ 
  onConnected, 
  variant = 'default' 
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConnectGmail = async () => {
    setIsLoading(true);
    try {
      const result = await gmailApi.connectGmail();
      // Redirect to Gmail OAuth
      window.location.href = result.authUrl;
      if (onConnected) onConnected();
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      alert('Failed to connect Gmail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnectGmail} 
      disabled={isLoading}
      variant={variant}
      className="flex items-center gap-2"
    >
      {isLoading ? 'Connecting...' : 'Connect Gmail'}
    </Button>
  );
};

export default GmailConnectButton;
