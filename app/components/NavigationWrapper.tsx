'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname === '/signin' ? children : (
    <>
      <Navigation />
      {children}
    </>
  );
} 