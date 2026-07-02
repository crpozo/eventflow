import React from "react";
import { Link } from "react-router-dom";
import { MdCheck, MdContentCopy } from "react-icons/md";

/**
 * adminUi — shared building blocks for the redesigned admin pages
 * (breadcrumb header, cards, labeled fields with counters, toggle, copy field,
 * buttons, chips). Tailwind-only, no external UI deps, dark-mode aware.
 *
 * ── TYPOGRAPHY STANDARD ──────────────────────────────────────────────────
 * Families come from index.css and are INHERITED — never set font-family here:
 * Inter for body/span, Outfit for h1–h6.
 *
 *  Página     · título h1: text-3xl font-bold text-navy-700
 *             · subtítulo: text-base text-gray-500 · breadcrumb: text-sm
 *  Tarjeta    · título h3: text-lg font-bold  · subtítulo: text-base gray-500
 *  Campos     · label: text-base font-semibold navy-700 · control: text-base
 *             · hint/counter: text-xs gray-400
 *  Botones    · text-sm font-semibold, px-3.5 py-2 — compactos (primario y
 *               secundario por igual); el cuerpo/inputs se quedan en text-base
 *  Micro      · chips y botones mini: text-xs font-medium
 *  Métricas   · valor: TYPE.metricValue · etiqueta: TYPE.metricLabel
 *  Tablas     · encabezado: TYPE.th · celda: TYPE.td (text-base)
 * Body text is text-base (16px) — 14/15px read too small in the admin. No
 * ad-hoc arbitrary sizes: any new admin page must use these tokens/components.
 */

// Reusable class tokens for patterns that aren't full components.
export const TYPE = {
  metricValue: "text-4xl font-bold text-navy-700 dark:text-white",
  metricLabel: "text-base font-medium text-gray-500",
  th: "text-xs font-bold uppercase tracking-wide text-gray-500",
  td: "text-base text-navy-700 dark:text-gray-100",
};

/* ── Page header: breadcrumb + title + right-side actions ─────────────── */
export function PageHeader({ crumbs = [], title, subtitle, actions }) {
  return (
    <div className="mb-4">
      {/* A single crumb just duplicates the title (e.g. "Dashboard / Dashboard")
          — breadcrumbs only render when there's actual hierarchy. */}
      {crumbs.length > 1 && (
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-gray-300">/</span>}
              {c.to ? (
                <Link
                  to={c.to}
                  className="max-w-[260px] truncate hover:text-brand-500 hover:no-underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="max-w-[260px] truncate font-medium text-navy-700 dark:text-white">
                  {c.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-700 dark:text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-base text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Card: titled white section ───────────────────────────────────────── */
export function Card({ title, subtitle, headerRight, children, className = "", ...rest }) {
  return (
    <section
      {...rest}
      className={`rounded-2xl bg-white p-4 shadow-card dark:!bg-navy-800 dark:text-white ${className}`}
    >
      {(title || headerRight) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-navy-700 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-base text-gray-500">{subtitle}</p>
            )}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Field: label + optional counter/hint wrapping any control ────────── */
export function Field({ label, required, counter, hint, children }) {
  const over = counter && counter.max && counter.value > counter.max;
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="text-base font-semibold text-navy-700 dark:text-white">
          {label} {required && <span className="text-brand-500">*</span>}
        </label>
        {counter && (
          <span
            className={`text-xs ${over ? "font-semibold text-brand-500" : "text-gray-400"}`}
          >
            {counter.value} / {counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function TextArea(props) {
  return (
    <textarea
      rows={props.rows || 3}
      {...props}
      className={`${inputCls} leading-relaxed ${props.className || ""}`}
    />
  );
}

/* ── Toggle switch ────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-teal-600" : "bg-gray-300 dark:bg-navy-600"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

/* ── Copy-to-clipboard field ──────────────────────────────────────────── */
export function CopyField({ value }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-3.5 pr-1.5 dark:border-white/10 dark:bg-navy-900">
      <span className="min-w-0 flex-1 truncate text-base text-gray-600 dark:text-gray-300">
        {value}
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-navy-700 shadow-sm transition hover:bg-gray-100 dark:bg-navy-700 dark:text-white"
      >
        {copied ? <MdCheck className="h-4 w-4 text-teal-600" /> : <MdContentCopy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/* ── Buttons ──────────────────────────────────────────────────────────── */
export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-navy-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700 ${className}`}
    >
      {children}
    </button>
  );
}

/* ── Status chip ──────────────────────────────────────────────────────── */
const CHIP_COLORS = {
  green: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  gray: "bg-gray-100 text-gray-600 dark:bg-navy-700 dark:text-gray-300",
  red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
};

export function Chip({ color = "gray", dot = true, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${CHIP_COLORS[color] || CHIP_COLORS.gray}`}
    >
      {/* bg-[currentColor]: this config replaces the whole palette and drops
          `current`, so the plain bg-current utility is never generated. */}
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-[currentColor]" />}
      {children}
    </span>
  );
}

/* ── "Guardado hace X" relative time ──────────────────────────────────── */
export function SavedAgo({ savedAt }) {
  const [, tick] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => {
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);
  if (!savedAt) return null;
  const secs = Math.floor((Date.now() - savedAt.getTime()) / 1000);
  const label =
    secs < 60
      ? "hace un momento"
      : secs < 3600
      ? `hace ${Math.floor(secs / 60)} min`
      : secs < 86400
      ? `hace ${Math.floor(secs / 3600)} h`
      : `hace ${Math.floor(secs / 86400)} d`;
  return (
    <span className="flex items-center gap-1 text-sm text-gray-500">
      <MdCheck className="h-4 w-4 text-teal-600" /> Guardado {label}
    </span>
  );
}
