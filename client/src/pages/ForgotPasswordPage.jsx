import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";
import Button from "../components/Button.jsx";
import Banner from "../components/Banner.jsx";
import { authApi } from "../api/auth.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-mint-500/10 flex items-center justify-center">
            <MailCheck className="w-7 h-7 text-mint-500" />
          </div>
          <p className="text-ink-900/70 text-sm leading-relaxed">
            If an account exists for <span className="font-semibold text-ink-900">{email}</span>,
            we've sent a link to reset your password.
          </p>
          <Link to="/login" className="text-signal-500 font-semibold text-sm hover:underline mt-1">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="We'll email you a link to reset it.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Banner type="error">{error}</Banner>

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full mt-1">
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-center text-ink-900/55 mt-6">
        Remembered it?{" "}
        <Link to="/login" className="text-signal-500 font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
