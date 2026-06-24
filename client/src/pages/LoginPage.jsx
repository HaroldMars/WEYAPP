import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";
import Button from "../components/Button.jsx";
import Banner from "../components/Banner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../api/auth.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setIsLoading(true);

    try {
      await login(email, password);
      const dest = location.state?.from || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.response?.data?.unverified) {
        setUnverifiedEmail(email);
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("");
    try {
      await authApi.resendVerification(unverifiedEmail);
      setResendStatus("Verification email sent. Please check your inbox.");
    } catch (err) {
      setResendStatus(err.message);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to keep the conversation going.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Banner type="error">{error}</Banner>
        {unverifiedEmail && (
          <Banner type="info">
            Your email isn't verified yet.{" "}
            <button type="button" onClick={handleResend} className="underline font-semibold">
              Resend verification email
            </button>
            {resendStatus && <span className="block mt-1">{resendStatus}</span>}
          </Banner>
        )}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-ink-900/40 hover:text-ink-900/70"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex justify-end -mt-1">
          <Link to="/forgot-password" className="text-sm text-signal-500 font-medium hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full mt-1">
          Log in
        </Button>
      </form>

      <p className="text-sm text-center text-ink-900/55 mt-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-signal-500 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
