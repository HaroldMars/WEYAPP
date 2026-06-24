import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-signal-500 text-white hover:bg-signal-400 active:scale-[0.98]",
  secondary: "bg-ink-900/5 text-ink-900 hover:bg-ink-900/10 active:scale-[0.98]",
  ghost: "bg-transparent text-ink-900 hover:bg-ink-900/5",
  danger: "bg-coral-500 text-white hover:bg-coral-500/90 active:scale-[0.98]",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
