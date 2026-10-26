import { useState, type FormEvent } from "react";
import { authApi, type ContactRequestCategory } from "../api/auth.api";

export function useContactAdmin() {
  const [contactUsername, setContactUsername] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCategory, setContactCategory] = useState<
    ContactRequestCategory | ""
  >("");
  const [contactDescription, setContactDescription] = useState("");
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const handleContactAdmin = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setContactMessage(null);

    const username = contactUsername.trim();
    const email = contactEmail.trim();
    const description = contactDescription.trim();

    if (username && username.length < 3) {
      setContactMessage("The Login name must be at least 3 characters long.");
      return;
    }

    if (!email) {
      setContactMessage("Please enter your contact email.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setContactMessage("Contact email is not valid.");
      return;
    }

    if (!contactCategory) {
      setContactMessage("Please select a support request category.");
      return;
    }

    if (description.length < 10) {
      setContactMessage(
        "Support description must be at least 10 characters long.",
      );
      return;
    }

    if (description.length > 2000) {
      setContactMessage("Support description cannot exceed 2000 characters.");
      return;
    }

    setIsSubmittingContact(true);

    try {
      await authApi.contactAdmin({
        username,
        email,
        category: contactCategory,
        description,
      });
    } catch {
      setContactMessage(
        "The information is valid, but the request submission feature is not yet connected to the server.",
      );
    } finally {
      setIsSubmittingContact(false);
    }
  };

  const resetContactMessage = () => setContactMessage(null);

  return {
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
    resetContactMessage,
  };
}
