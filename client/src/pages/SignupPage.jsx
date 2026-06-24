import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import TextField from "../components/TextField.jsx";
import Button from "../components/Button.jsx";
import Banner from "../components/Banner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
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
            We sent a verification link to <span className="font-semibold text-ink-900">{email}</span>.
            Click the link to activate your account, then come back to log in.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full mt-2">
            Go to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start chatting in a couple of minutes.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Banner type="error">{error}</Banner>

        <TextField
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Cruz"
          autoComplete="name"
          required
        />

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

        <Button type="submit" isLoading={isLoading} className="w-full mt-1">
          Create account
        </Button>
      </form>

      <p className="text-sm text-center text-ink-900/55 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-signal-500 font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
