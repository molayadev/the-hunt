'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthGate } from '@/features/auth/AuthGate';

function HomeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/hunts');
  }, [router]);
  return null;
}

export default function Home() {
  return (
    <AuthGate>
      <HomeRedirect />
    </AuthGate>
  );
}
