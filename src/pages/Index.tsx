
import React from 'react';
import { Dashboard } from '@/components/layout/Dashboard';
import Landing from './Landing';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  // Show Landing (with Access Demo) while loading to avoid blank screen
  if (isLoading) return <Landing />;
  return isAuthenticated ? <Dashboard /> : <Landing />;
};

export default Index;
