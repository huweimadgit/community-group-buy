export type UserRole = 'user' | 'leader' | 'admin';

export interface User {
  id: number;
  username: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
}
