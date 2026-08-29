import { useAuthContext, type AuthContextType } from '@/context/AuthContext';

export function useAuth(): AuthContextType {
  return useAuthContext();
}
