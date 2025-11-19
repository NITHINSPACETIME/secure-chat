
import { atom } from 'jotai';

export type AuthState = {
  isAuthenticated: boolean;
};

const getInitialAuthState = (): AuthState => {
  const userId = localStorage.getItem('userId');
  return {
    isAuthenticated: !!userId,
  };
};

export const authStateAtom = atom<AuthState>(getInitialAuthState());

export const setAuthenticatedAtom = atom(
  null,
  (get, set, value: boolean) => {
    if (!value) {
      localStorage.clear();
    }
    set(authStateAtom, {
      isAuthenticated: value,
    });
  }
);
