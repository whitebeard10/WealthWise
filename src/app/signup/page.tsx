
'use client';

import { SignupForm } from '@/components/auth/SignupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function SignupPage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/'); // Redirect if already logged in
    }
  }, [currentUser, loading, router]);

  if (loading || (!loading && currentUser)) {
    return <Loading />;
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
