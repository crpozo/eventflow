// Clases Tailwind del estado checked por color (paleta Horizon UI).
const CLASES_CHECKED_POR_COLOR = {
  red: "checked:bg-red-500 dark:checked:bg-red-400",
  blue: "checked:bg-blue-500 dark:checked:bg-blue-400",
  green: "checked:bg-green-500 dark:checked:bg-green-400",
  yellow: "checked:bg-yellow-500 dark:checked:bg-yellow-400",
  orange: "checked:bg-orange-500 dark:checked:bg-orange-400",
  teal: "checked:bg-teal-500 dark:checked:bg-teal-400",
  navy: "checked:bg-navy-500 dark:checked:bg-navy-400",
  lime: "checked:bg-lime-500 dark:checked:bg-lime-400",
  cyan: "checked:bg-cyan-500 dark:checked:bg-cyan-400",
  pink: "checked:bg-pink-500 dark:checked:bg-pink-400",
  purple: "checked:bg-purple-500 dark:checked:bg-purple-400",
  amber: "checked:bg-amber-500 dark:checked:bg-amber-400",
  indigo: "checked:bg-indigo-500 dark:checked:bg-indigo-400",
  gray: "checked:bg-gray-500 dark:checked:bg-gray-400",
};

const CLASES_CHECKED_DEFAULT = "checked:bg-brand-500 dark:checked:bg-brand-400";

// hasOwnProperty evita resolver claves del prototipo (p. ej. "constructor").
const clasesChecked = (color) =>
  Object.prototype.hasOwnProperty.call(CLASES_CHECKED_POR_COLOR, color)
    ? CLASES_CHECKED_POR_COLOR[color]
    : CLASES_CHECKED_DEFAULT;

const Switch = (props) => {
  const { extra, color, ...rest } = props;
  return (
    <input
      type="checkbox"
      className={`relative h-5 w-10 appearance-none rounded-[20px] bg-[#e0e5f2] outline-none transition duration-[0.5s]
      before:absolute before:top-[50%] before:h-4 before:w-4 before:translate-x-[2px] before:translate-y-[-50%] before:rounded-[20px]
      before:bg-white before:shadow-[0_2px_5px_rgba(0,_0,_0,_.2)] before:transition before:content-[""]
      checked:before:translate-x-[22px] hover:cursor-pointer
      dark:bg-white/5 ${clasesChecked(color)} ${extra}`}
      name="weekly"
      {...rest}
    />
  );
};

export default Switch;
