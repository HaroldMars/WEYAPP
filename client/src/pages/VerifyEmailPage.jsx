import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import { authApi } from "../api/auth.js";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    authApi
      .verifyEmail(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      <div className="flex flex-col items-center text-center gap-4 py-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 text-signal-500 animate-spin" />
            <p className="text-ink-900/60 text-sm">Verifying your email...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-mint-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-mint-500" />
            </div>
            <p className="text-ink-900/70 text-sm">{message}</p>
            <Link to="/login" className="w-full">
              <Button className="w-full mt-1">Go to login</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-coral-500/10 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-coral-500" />
            </div>
            <p className="text-ink-900/70 text-sm">{message}</p>
            <Link to="/login" className="text-signal-500 font-semibold text-sm hover:underline mt-1">
              Back to login
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
