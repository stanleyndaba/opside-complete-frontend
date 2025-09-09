
import React from 'react';
import { Dashboard } from '@/components/layout/Dashboard';
import Landing from './Landing';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Dashboard /> : <Landing />;
};

export default Index;
