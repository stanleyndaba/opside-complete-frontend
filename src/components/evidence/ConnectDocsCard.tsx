import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ConnectDocsCard: React.FC = () => {
  return (
    <Card className="text-center p-6">
      <CardHeader>
        <CardTitle className="text-xl">Connect Your Documents</CardTitle>
        <CardDescription>
          Securely link your documentation sources to begin evidence collection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/evidence-onboarding">
              Start Setup
            </Link>
          </Button>
          <Button variant="outline">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectDocsCard;
