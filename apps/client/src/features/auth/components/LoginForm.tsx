import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import styles from "../Login.module.scss";

interface LoginFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  isLoading: boolean;
  errorMessage: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
  onContactAdmin: () => void;
}

export default function LoginForm({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  errorMessage,
  handleSubmit,
  onForgotPassword,
  onContactAdmin,
}: LoginFormProps) {
  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Chào mừng trở lại!</h2>
        <p className={styles.formSubtitle}>
          Đăng nhập vào tài khoản để tiếp tục
        </p>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      )}

      <form className={styles.login} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>
            <User size={20} />
          </span>

          <input
            type="text"
            className={styles.inputField}
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </div>

        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>
            <Lock size={18} />
          </span>

          <input
            type={showPassword ? "text" : "password"}
            className={styles.inputField}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="button"
          className={styles.forgotPassword}
          onClick={onForgotPassword}
        >
          Quên mật khẩu?
        </button>

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? (
            <Loader2
              size={18}
              className="animate-spin"
              style={{ margin: "auto" }}
            />
          ) : (
            "ĐĂNG NHẬP"
          )}
        </button>
      </form>

      <div className={styles.bottomText}>
        Chưa có tài khoản?{" "}
        <button
          type="button"
          className={styles.contactAdminLink}
          onClick={onContactAdmin}
        >
          Liên hệ quản trị viên
        </button>
      </div>
    </div>
  );
}
