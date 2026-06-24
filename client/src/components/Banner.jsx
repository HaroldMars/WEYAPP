import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const config = {
  success: { icon: CheckCircle2, classes: "bg-mint-500/10 text-mint-500 border-mint-500/20" },
  error: { icon: AlertCircle, classes: "bg-coral-500/10 text-coral-500 border-coral-500/20" },
  info: { icon: Info, classes: "bg-signal-500/10 text-signal-500 border-signal-500/20" },
};

export default function Banner({ type = "info", children }) {
  if (!children) return null;
  const { icon: Icon, classes } = config[type];

  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium ${classes}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
