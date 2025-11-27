import { useState, useEffect } from 'react';
import { getUser as getUserFromStore } from '../store/auth';
import type { User } from '../store/auth';

export function useUser() {
  const [user, setUser] = useState<User | null>(getUserFromStore());

  useEffect(() => {
    // Update user state when storage changes (e.g., login/logout in another tab)
    const handleStorageChange = () => {
      setUser(getUserFromStore());
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user };
}

