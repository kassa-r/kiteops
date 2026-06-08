import { useQuery } from '@tanstack/react-query';
import { AuthService } from '@/lib/auth-service';

export function useUserRole() {
  return useQuery({
    queryKey: ['userRole'],
    queryFn: () => AuthService.getUserRole(),
  });
}
