import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { authApi, type UserRole } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

const REDIRECT_PATHS: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  MANAGER: "/dashboard",
  STAFF: "/pos",
};

export function useLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.login({
        username: normalizedUsername,
        password,
      });

      if (!result?.accessToken || !result?.user) {
        setErrorMessage("Thông tin xác thực không hợp lệ từ máy chủ.");
        return;
      }

      const redirectPath = REDIRECT_PATHS[result.user.role];
      if (!redirectPath) {
        setErrorMessage("Tài khoản chưa được cấu hình phân quyền hợp lệ.");
        return;
      }

      login(result.accessToken, result.refreshToken, result.user);

      navigate(redirectPath, { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
        const message = error.response?.data?.message;
        setErrorMessage(
          Array.isArray(message)
            ? message.join(", ")
            : typeof message === "string"
              ? message
              : "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.",
        );
      } else {
        setErrorMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
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
