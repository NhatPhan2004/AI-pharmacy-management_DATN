import { useState, type FormEvent } from "react";
import axios from "axios";
import { authApi, type UserRole } from "../api/auth.api";

const REDIRECT_PATHS: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  MANAGER: "/manager/dashboard",
  STAFF: "/pos",
};

export function useLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.login({
        username: normalizedUsername,
        password,
      });

      if (!result?.accessToken || !result?.refreshToken || !result?.user) {
        setErrorMessage("Invalid login credentials.");
        return;
      }

      const redirectPath = REDIRECT_PATHS[result.user.role];

      if (!redirectPath) {
        setErrorMessage("The account does not have valid access rights.");
        return;
      }

      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("currentUser", JSON.stringify(result.user));

      window.location.href = redirectPath;
    } catch (error: unknown) {
      if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
        const message = error.response?.data?.message;

        setErrorMessage(
          Array.isArray(message)
            ? message.join(", ")
            : typeof message === "string"
              ? message
              : "Login failed. Please check your username and password.",
        );
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    errorMessage,
    setErrorMessage,
    handleSubmit,
  };
}
