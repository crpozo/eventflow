// Custom components
import React from "react";

// Clases de borde/texto según el estado del campo (deshabilitado > error >
// éxito > normal).
const stateClasses = (disabled, state) => {
  if (disabled === true)
    return "!border-none !bg-gray-100 dark:!bg-white/5 dark:placeholder:!text-[rgba(255,255,255,0.15)]";
  if (state === "error")
    return "!border-red-500 text-red-500 placeholder:text-red-500 dark:!border-red-400 dark:!text-red-400 dark:placeholder:!text-red-400";
  if (state === "success")
    return "!border-green-500 text-green-500 placeholder:text-green-500 dark:!border-green-400 dark:!text-green-400 dark:placeholder:!text-green-400";
  return "border-gray-200 dark:!border-white/10 dark:text-white";
};

function InputField(props) {
  const { label, id, extra, placeholder, cols, rows, state, disabled } = props;

  return (
    <div className={`${extra}`}>
      <label
        htmlFor={id}
        className="ml-3 mb-2 text-sm font-bold text-navy-700 dark:text-white"
      >
        {label}
      </label>
      <div>
        <textarea
          cols={cols}
          rows={rows}
          placeholder={placeholder}
          className={`flex w-full items-center justify-center rounded-xl border bg-white/0 pl-3 pt-3 text-sm outline-none ${stateClasses(
            disabled,
            state
          )}`}
          name={id}
          id={id}
        />
      </div>
    </div>
  );
}

export default InputField;
