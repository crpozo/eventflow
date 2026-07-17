// Clases Tailwind de la barra por color (paleta Horizon UI).
const CLASES_BARRA_POR_COLOR = {
  red: "bg-red-500 dark:bg-red-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  green: "bg-green-500 dark:bg-green-400",
  yellow: "bg-yellow-500 dark:bg-yellow-400",
  orange: "bg-orange-500 dark:bg-orange-400",
  teal: "bg-teal-500 dark:bg-teal-400",
  navy: "bg-navy-500 dark:bg-navy-400",
  lime: "bg-lime-500 dark:bg-lime-400",
  cyan: "bg-cyan-500 dark:bg-cyan-400",
  pink: "bg-pink-500 dark:bg-pink-400",
  purple: "bg-purple-500 dark:bg-purple-400",
  amber: "bg-amber-500 dark:bg-amber-400",
  indigo: "bg-indigo-500 dark:bg-indigo-400",
  gray: "bg-gray-500 dark:bg-gray-400",
};

const CLASES_BARRA_DEFAULT = "bg-brand-500 dark:bg-brand-400";

// hasOwnProperty evita resolver claves del prototipo (p. ej. "constructor").
const clasesBarra = (color) =>
  Object.prototype.hasOwnProperty.call(CLASES_BARRA_POR_COLOR, color)
    ? CLASES_BARRA_POR_COLOR[color]
    : CLASES_BARRA_DEFAULT;

const Progress = (props) => {
  const { value, color, width } = props;
  return (
    <div
      className={`h-2 ${
        width || "w-full"
      } rounded-full bg-gray-200 dark:bg-navy-700`}
    >
      <div
        className={`flex h-full items-center justify-center rounded-full ${clasesBarra(
          color
        )}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

export default Progress;
