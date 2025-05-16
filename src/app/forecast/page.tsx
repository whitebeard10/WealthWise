
'use client';

import { ForecastForm } from '@/components/forecast/ForecastForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter }from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function ForecastPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return <Loading />;
  }
  
  return (
    <div className="space-y-6">
      {/* Page title and description are handled within ForecastForm Card */}
      <ForecastForm />
    </div>
  );
}
