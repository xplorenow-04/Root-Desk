import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../services/usersApi';

/**
 * Hook to fetch all users (for assignee pickers).
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });
};
