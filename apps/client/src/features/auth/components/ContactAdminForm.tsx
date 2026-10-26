import {
  User,
  Mail,
  Headset,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react";
import styles from "../Login.module.scss";
import type { ContactRequestCategory } from "../api/auth.api";

interface ContactAdminFormProps {
  contactUsername: string;
  setContactUsername: (value: string) => void;
  contactEmail: string;
  setContactEmail: (value: string) => void;
  contactCategory: ContactRequestCategory | "";
  setContactCategory: (value: ContactRequestCategory | "") => void;
  contactDescription: string;
  setContactDescription: (value: string) => void;
  contactMessage: string | null;
  isSubmittingContact: boolean;
  handleContactAdmin: (event: React.FormEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
}

export default function ContactAdminForm({
  contactUsername,
  setContactUsername,
  contactEmail,
  setContactEmail,
  contactCategory,
  setContactCategory,
  contactDescription,
  setContactDescription,
  contactMessage,
  isSubmittingContact,
  handleContactAdmin,
  onBackToLogin,
}: ContactAdminFormProps) {
  return (
    <div className={styles.contactAdminContent}>
      <div className={styles.contactAdminHeader}>
        <div className={styles.contactAdminIcon}>
          <Headset size={25} strokeWidth={1.8} />
        </div>

        <h2 className={styles.contactAdminTitle}>Liên hệ quản trị viên</h2>

        <p className={styles.contactAdminDescription}>
          Gửi yêu cầu hỗ trợ tài khoản PharmAI. Chúng tôi sẽ hỗ trợ bạn sớm nhất
          có thể.
        </p>
      </div>

      <form className={styles.contactAdminForm} onSubmit={handleContactAdmin}>
        <div className={styles.contactField}>
          <label htmlFor="contactUsername">
            Tên đăng nhập <span>(nếu đã có tài khoản)</span>
          </label>

          <div className={styles.contactInputWrapper}>
            <span className={styles.contactInputIcon}>
              <User size={18} />
            </span>

            <input
              id="contactUsername"
              name="username"
              type="text"
              className={styles.contactInput}
              placeholder="Nhập tên đăng nhập"
              autoComplete="username"
              value={contactUsername}
              onChange={(event) => setContactUsername(event.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        <div className={styles.contactField}>
          <label htmlFor="contactEmail">Email liên hệ</label>

          <div className={styles.contactInputWrapper}>
            <span className={styles.contactInputIcon}>
              <Mail size={18} />
            </span>

            <input
              id="contactEmail"
              name="email"
              type="email"
              className={styles.contactInput}
              placeholder="Nhập email để nhận phản hồi"
              autoComplete="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              required
              maxLength={254}
            />
          </div>
        </div>

        <div className={styles.contactField}>
          <label htmlFor="contactCategory">Loại yêu cầu</label>

          <div className={styles.contactSelectWrapper}>
            <select
              id="contactCategory"
              name="category"
              className={styles.contactSelect}
              value={contactCategory}
              onChange={(event) =>
                setContactCategory(
                  event.target.value as ContactRequestCategory | "",
                )
              }
              required
            >
              <option value="" disabled>
                Chọn loại yêu cầu hỗ trợ
              </option>
              <option value="LOGIN_ISSUE">Không thể đăng nhập</option>
              <option value="ACCOUNT_LOCKED">Tài khoản bị khóa</option>
              <option value="PASSWORD_ISSUE">Vấn đề về mật khẩu</option>
              <option value="ACCOUNT_REQUEST">
                Yêu cầu cấp tài khoản nhân viên
              </option>
              <option value="OTHER">Vấn đề khác</option>
            </select>

            <ChevronDown className={styles.contactSelectIcon} size={18} />
          </div>
        </div>

        <div className={styles.contactField}>
          <label htmlFor="contactDescription">Nội dung cần hỗ trợ</label>

          <div className={styles.contactTextareaWrapper}>
            <FileText className={styles.contactTextareaIcon} size={18} />

            <textarea
              id="contactDescription"
              name="description"
              className={styles.contactTextarea}
              placeholder="Mô tả vấn đề của bạn..."
              value={contactDescription}
              onChange={(event) => setContactDescription(event.target.value)}
              minLength={10}
              maxLength={2000}
              rows={3}
              required
            />
          </div>

          <span className={styles.contactCharCount}>
            {contactDescription.length}/2000 ký tự
          </span>
        </div>

        {contactMessage && (
          <div
            className={styles.contactFeedback}
            role="status"
            aria-live="polite"
          >
            {contactMessage}
          </div>
        )}

        <button
          type="submit"
          className={styles.forgotSubmit}
          disabled={isSubmittingContact}
        >
          {isSubmittingContact ? (
            <>
              <Loader2 size={17} className={styles.contactSpinner} />
              Đang gửi...
            </>
          ) : (
            "Gửi yêu cầu hỗ trợ"
          )}
        </button>
      </form>

      <button
        type="button"
        className={styles.backToLogin}
        onClick={onBackToLogin}
      >
        ← Quay lại đăng nhập
      </button>

      <p className={styles.contactPrivacyNote}>
        Thông tin của bạn chỉ được sử dụng để xử lý yêu cầu hỗ trợ.
      </p>
    </div>
  );
}
