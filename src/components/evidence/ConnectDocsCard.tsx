import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GmailConnectButton from './GmailConnectButton';

const ConnectDocsCard: React.FC = () => {
  const handleGmailConnected = () => {
    console.log('Gmail connection initiated');
    // You can add redirect or state update here
  };

  return (
    <Card className="text-center p-6">
      <CardHeader>
        <CardTitle className="text-xl">Connect Your Documents</CardTitle>
        <CardDescription>
          Securely link your Gmail to automatically find invoices and receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <GmailConnectButton onConnected={handleGmailConnected} />
          <p className="text-sm text-muted-foreground">
            We'll scan for purchase confirmations, invoices, and shipping documents
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectDocsCard;
