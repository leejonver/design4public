'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@vapor-ui/core';
import { AuthProvider } from '@/contexts/AuthContext';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
