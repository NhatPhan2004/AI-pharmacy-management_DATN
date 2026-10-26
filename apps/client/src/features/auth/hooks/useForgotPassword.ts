import { useState, type FormEvent } from "react";
import { authApi } from "../api/auth.api";

export function useForgotPassword() {
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setForgotMessage(null);

    const username = forgotUsername.trim();
    const email = forgotEmail.trim();

    if (username.length < 3) {
      setForgotMessage("The Login name must be at least 3 characters long.");
      return;
    }

    if (!email) {
      setForgotMessage("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setForgotMessage("Email is not valid.");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword({ username, email });
    } catch {
      setForgotMessage(
        "The password reset feature is not yet connected to the server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForgotMessage = () => setForgotMessage(null);

  return {
    forgotUsername,
    setForgotUsername,
    forgotEmail,
    setForgotEmail,
    forgotMessage,
    isLoading,
    handleForgotPassword,
    resetForgotMessage,
  };
}
