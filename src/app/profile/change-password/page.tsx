
'use client';

import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';

export default function ChangePasswordPage() {
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
    <div className="flex min-h-[calc(100vh-var(--header-height,4rem)-2rem)] flex-col items-center justify-center p-4"> {/* Adjust min-h if you have a fixed header */}
      <ChangePasswordForm />
    </div>
  );
}
