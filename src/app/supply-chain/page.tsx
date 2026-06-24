'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupplyChainRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/inventory?tab=pos');
  }, [router]);

  return null;
}
