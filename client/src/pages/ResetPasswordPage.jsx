import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";
import Button from "../components/Button.jsx";
import Banner from "../components/Banner.jsx";
import { authApi } from "../api/auth.js";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-mint-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-mint-500" />
          </div>
          <p className="text-ink-900/70 text-sm">Redirecting you to log in...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Banner type="error">{error}</Banner>

        <TextField
          label="New password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
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

        <TextField
          label="Confirm new password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
        />

        <Button type="submit" isLoading={isLoading} className="w-full mt-1">
          Reset password
        </Button>
      </form>

      <p className="text-sm text-center text-ink-900/55 mt-6">
        <Link to="/login" className="text-signal-500 font-semibold hover:underline">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
