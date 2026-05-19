import { router, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LOGIN_PATH } from "@/const";
import { postJson } from "@/lib/http";

export type AppUser = {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin" | "moderator" | "teacher";
  teacher_status?: "ожидает" | "одобрен" | "отклонён" | null;
  instrument?: string | null;
  level?: string | null;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const { props } = usePage<{ auth?: { user: AppUser | null } }>();
  const user = props.auth?.user ?? null;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    setError(null);

    try {
      await postJson<{ success: boolean }>("/logout");
      router.visit(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Не удалось выйти из аккаунта."));
    } finally {
      setIsLoggingOut(false);
    }
  }, [redirectPath]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        router.visit(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, user, redirectPath]);

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: isLoggingOut,
      error,
      logout,
      refresh: () => router.reload({ only: ["auth"] }),
    }),
    [user, isLoggingOut, error, logout],
  );
}
