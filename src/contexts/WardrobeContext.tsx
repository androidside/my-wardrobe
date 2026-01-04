import { createContext, useContext, ReactNode } from 'react';
import { useWardrobes } from '@/hooks/useWardrobes';

interface WardrobeContextType {
  wardrobes: ReturnType<typeof useWardrobes>;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const wardrobes = useWardrobes();
  
  return (
    <WardrobeContext.Provider value={{ wardrobes }}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobeContext() {
  const context = useContext(WardrobeContext);
  if (context === undefined) {
    throw new Error('useWardrobeContext must be used within a WardrobeProvider');
  }
  return context.wardrobes;
}

