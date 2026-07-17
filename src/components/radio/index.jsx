// Clases Tailwind del estado checked por color (paleta Horizon UI).
const CLASES_CHECKED_POR_COLOR = {
  red: "checked:!border-red-500 checked:before:!bg-red-500 dark:checked:!border-red-400 dark:checked:before:!bg-red-400",
  blue: "checked:!border-blue-500 checked:before:!bg-blue-500 dark:checked:!border-blue-400 dark:checked:before:!bg-blue-400",
  green:
    "checked:!border-green-500 checked:before:!bg-green-500 dark:checked:!border-green-400 dark:checked:before:!bg-green-400",
  yellow:
    "checked:!border-yellow-500 checked:before:!bg-yellow-500 dark:checked:!border-yellow-400 dark:checked:before:!bg-yellow-400",
  orange:
    "checked:!border-orange-500 checked:before:!bg-orange-500 dark:checked:!border-orange-400 dark:checked:before:!bg-orange-400",
  teal: "checked:!border-teal-500 checked:before:!bg-teal-500 dark:checked:!border-teal-400 dark:checked:before:!bg-teal-400",
  navy: "checked:!border-navy-500 checked:before:!bg-navy-500 dark:checked:!border-navy-400 dark:checked:before:!bg-navy-400",
  lime: "checked:!border-lime-500 checked:before:!bg-lime-500 dark:checked:!border-lime-400 dark:checked:before:!bg-lime-400",
  cyan: "checked:!border-cyan-500 checked:before:!bg-cyan-500 dark:checked:!border-cyan-400 dark:checked:before:!bg-cyan-400",
  pink: "checked:!border-pink-500 checked:before:!bg-pink-500 dark:checked:!border-pink-400 dark:checked:before:!bg-pink-400",
  purple:
    "checked:!border-purple-500 checked:before:!bg-purple-500 dark:checked:!border-purple-400 dark:checked:before:!bg-purple-400",
  amber:
    "checked:!border-amber-500 checked:before:!bg-amber-500 dark:checked:!border-amber-400 dark:checked:before:!bg-amber-400",
  indigo:
    "checked:!border-indigo-500 checked:before:!bg-indigo-500 dark:checked:!border-indigo-400 dark:checked:before:!bg-indigo-400",
  gray: "checked:!border-gray-500 checked:before:!bg-gray-500 dark:checked:!border-gray-400 dark:checked:before:!bg-gray-400",
};

const CLASES_CHECKED_DEFAULT =
  "checked:!border-brand-500 checked:before:!bg-brand-500 dark:checked:!border-brand-400 dark:checked:before:!bg-brand-400";

// Object.hasOwn evita resolver claves del prototipo (p. ej. "constructor").
const clasesChecked = (color) =>
  Object.hasOwn(CLASES_CHECKED_POR_COLOR, color)
    ? CLASES_CHECKED_POR_COLOR[color]
    : CLASES_CHECKED_DEFAULT;

const Radio = (props) => {
  const { color, id, name, ...rest } = props;
  return (
    <input
      id={id}
      name={name}
      type="radio"
      className={`before:contet[""] relative h-5 w-5 cursor-pointer appearance-none rounded-full
       border !border-gray-300 transition-all duration-[0.2s] before:absolute before:top-[3px]
       before:left-[50%] before:h-3 before:w-3 before:translate-x-[-50%] before:rounded-full before:transition-all before:duration-[0.2s] dark:!border-gray-800
       ${clasesChecked(color)} `}
      {...rest}
    />
  );
};

export default Radio;
