export default function TextField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  autoComplete,
  id,
  rightElement,
  maxLength,
}) {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-900/80">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white text-ink-900 placeholder:text-ink-900/35
            transition-colors duration-150 outline-none
            ${error ? "border-coral-500" : "border-ink-900/10 focus:border-signal-500"}
            ${rightElement ? "pr-11" : ""}`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-coral-500 font-medium">{error}</p>}
    </div>
  );
}
