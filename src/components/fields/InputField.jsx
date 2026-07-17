// Custom components
import React from "react";

// Clases de borde/texto según el estado del campo (deshabilitado > error >
// éxito > normal).
const stateClasses = (disabled, state) => {
  if (disabled === true)
    return "!border-none !bg-gray-100 dark:!bg-white/5 dark:placeholder:!text-[rgba(255,255,255,0.15)]";
  if (state === "error")
    return "border-red-500 text-red-500 placeholder:text-red-500 dark:!border-red-400 dark:!text-red-400 dark:placeholder:!text-red-400";
  if (state === "success")
    return "border-green-500 text-green-500 placeholder:text-green-500 dark:!border-green-400 dark:!text-green-400 dark:placeholder:!text-green-400";
  return "border-gray-200 dark:!border-white/10 dark:text-white";
};

function InputField(props) {
  const { label, id, extra, type, placeholder, variant, state, disabled } =
    props;

  return (
    <div className={`${extra}`}>
      <label
        htmlFor={id}
        className={`text-sm text-navy-700 dark:text-white ${
          variant === "auth" ? "ml-1.5 font-medium" : "ml-3 font-bold"
        }`}
      >
        {label}
      </label>
      <input
        disabled={disabled}
        type={type}
        id={id}
        placeholder={placeholder}
        className={`mt-2 flex h-12 w-full items-center justify-center rounded-xl border bg-white/0 p-3 text-sm outline-none ${stateClasses(
          disabled,
          state
        )}`}
      />
    </div>
  );
}

export default InputField;
