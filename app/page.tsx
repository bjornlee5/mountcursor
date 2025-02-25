'use client';

import ProtectedRoute from './components/ProtectedRoute';
import FluxGenerator from './components/FluxGenerator';

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="container mx-auto px-4 py-8">
        <FluxGenerator />
      </main>
    </ProtectedRoute>
  );
} 