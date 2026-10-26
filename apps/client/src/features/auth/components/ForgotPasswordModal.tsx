import { Mail, UserRound } from "lucide-react";
import type { FormEvent } from "react";
import styles from "../Login.module.scss";

interface ForgotPasswordModalProps {
  forgotUsername: string;
  setForgotUsername: (value: string) => void;
  forgotEmail: string;
  setForgotEmail: (value: string) => void;
  forgotMessage: string | null;
  isLoading: boolean;
  handleForgotPassword: (event: FormEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordModal({
  forgotUsername,
  setForgotUsername,
  forgotEmail,
  setForgotEmail,
  forgotMessage,
  isLoading,
  handleForgotPassword,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  return (
    <div className={styles.forgotPasswordContent}>
      <h2 className={styles.forgotTitle}>Bạn quên mật khẩu?</h2>

      <p className={styles.forgotDescription}>
        Nhập tên đăng nhập để khôi phục tài khoản của bạn.
      </p>

      <form className={styles.forgotForm} onSubmit={handleForgotPassword}>
        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>
            <UserRound size={18} />
          </span>

          <input
            id="forgotUsername"
            name="username"
            type="text"
            className={styles.inputField}
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
            value={forgotUsername}
            onChange={(event) => setForgotUsername(event.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className={styles.inputGroup}>
          <span className={styles.inputIcon}>
            <Mail size={18} />
          </span>

          <input
            id="forgotEmail"
            name="email"
            type="email"
            className={styles.inputField}
            placeholder="Nhập email của bạn"
            autoComplete="email"
            value={forgotEmail}
            onChange={(event) => setForgotEmail(event.target.value)}
            required
          />
        </div>

        {forgotMessage && (
          <div className={styles.errorBanner} role="status">
            {forgotMessage}
          </div>
        )}

        <button
          type="submit"
          className={styles.forgotSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Đang xử lý..." : "Gửi yêu cầu khôi phục"}
        </button>
      </form>

      <button
        type="button"
        className={styles.backToLogin}
        onClick={onBackToLogin}
      >
        ← Quay lại đăng nhập
      </button>
    </div>
  );
}
