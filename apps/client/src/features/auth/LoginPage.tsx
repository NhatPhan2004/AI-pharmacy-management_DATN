import { useState } from "react";

import logoImg from "../../assets/logo.png";
import logoLogin from "../../assets/bg_login.png";
import styles from "./Login.module.scss";

import { useLogin } from "./hooks/useLogin";
import { useForgotPassword } from "./hooks/useForgotPassword";
import { useContactAdmin } from "./hooks/useContactAdmin";

import LoginForm from "./components/LoginForm";
import ForgotPasswordModal from "./components/ForgotPasswordModal";
import ContactAdminForm from "./components/ContactAdminForm";

type AuthView = "login" | "forgot-password" | "contact-admin";

export default function LoginPage() {
  const [authView, setAuthView] = useState<AuthView>("login");

  const login = useLogin();
  const forgotPassword = useForgotPassword();
  const contactAdmin = useContactAdmin();

  const showLogin = () => {
    setAuthView("login");
    login.setErrorMessage(null);
    forgotPassword.resetForgotMessage();
    contactAdmin.resetContactMessage();
  };

  const showForgotPassword = () => {
    setAuthView("forgot-password");
    forgotPassword.resetForgotMessage();
    contactAdmin.resetContactMessage();
  };

  const showContactAdmin = () => {
    setAuthView("contact-admin");
    contactAdmin.resetContactMessage();
    forgotPassword.resetForgotMessage();
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.leftPanel}>
          <div className={styles.brandHeader}>
            <div className={styles.logoWrapper}>
              <img src={logoImg} alt="PharmAI Logo" className={styles.logo} />
            </div>

            <div className={styles.brandInfo}>
              <h3 className={styles.brandName}>PharmAI</h3>
              <p className={styles.brandTagline}>SMART PHARMACY PLATFORM</p>
            </div>
          </div>

          <div className={styles.heroContent}>
            <img
              src={logoLogin}
              alt="PharmAI Login"
              className={styles.heroImage}
            />

            <p className={styles.heroSubtitle}>
              Quản lý nhà thuốc thông minh. <br />
              Phân tích dữ liệu chuyên sâu.
              <br />
              Hỗ trợ quyết định tối ưu.
            </p>
          </div>
        </div>

        <div className={styles.rightPanel}>
          {authView === "login" && (
            <LoginForm
              username={login.username}
              setUsername={login.setUsername}
              password={login.password}
              setPassword={login.setPassword}
              showPassword={login.showPassword}
              setShowPassword={login.setShowPassword}
              isLoading={login.isLoading}
              errorMessage={login.errorMessage}
              handleSubmit={login.handleSubmit}
              onForgotPassword={showForgotPassword}
              onContactAdmin={showContactAdmin}
            />
          )}

          {authView === "forgot-password" && (
            <ForgotPasswordModal
              forgotUsername={forgotPassword.forgotUsername}
              setForgotUsername={forgotPassword.setForgotUsername}
              forgotEmail={forgotPassword.forgotEmail}
              setForgotEmail={forgotPassword.setForgotEmail}
              forgotMessage={forgotPassword.forgotMessage}
              isLoading={forgotPassword.isLoading}
              handleForgotPassword={forgotPassword.handleForgotPassword}
              onBackToLogin={showLogin}
            />
          )}

          {authView === "contact-admin" && (
            <ContactAdminForm
              contactUsername={contactAdmin.contactUsername}
              setContactUsername={contactAdmin.setContactUsername}
              contactEmail={contactAdmin.contactEmail}
              setContactEmail={contactAdmin.setContactEmail}
              contactCategory={contactAdmin.contactCategory}
              setContactCategory={contactAdmin.setContactCategory}
              contactDescription={contactAdmin.contactDescription}
              setContactDescription={contactAdmin.setContactDescription}
              contactMessage={contactAdmin.contactMessage}
              isSubmittingContact={contactAdmin.isSubmittingContact}
              handleContactAdmin={contactAdmin.handleContactAdmin}
              onBackToLogin={showLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
