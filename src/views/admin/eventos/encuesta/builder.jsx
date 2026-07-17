import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Field,
  TextInput,
  TextArea,
  Toggle,
  SecondaryButton,
  Chip,
} from "components/adminUi";
import {
  MdDragIndicator,
  MdContentCopy,
  MdDeleteOutline,
  MdClose,
  MdAdd,
  MdAutoAwesome,
  MdInfoOutline,
  MdKeyboardArrowDown,
  MdOutlineCalendarMonth,
  MdRadioButtonChecked,
  MdCheckBox,
  MdOutlineArrowDropDownCircle,
  MdShortText,
  MdNotes,
  MdTag,
  MdTitle,
  MdOutlineSubject,
  MdHelpOutline,
} from "react-icons/md";

/**
 * Custom React survey builder — replaces jQuery formBuilder on the admin page
 * while staying 100% compatible with its JSON: the public page renders
 * Survey.questions with jQuery formRender, and the results dashboard + the
 * analysis Lambda join answers by each field's `name`.
 *
 * DATA-COMPAT RULES (do not break):
 *  · Each hydrated field keeps its ORIGINAL formBuilder object in `raw`; on
 *    export we spread `raw` and overwrite only what the UI edits (label,
 *    required, values, placeholder). Unknown props (subtype, multiple, inline,
 *    other, toggle, description, min/max…) survive untouched.
 *  · `name` NEVER changes for existing fields. New fields get the formBuilder
 *    format "{type}-{Date.now()}-{seq}".
 *  · Option values: new options get sequential "option-N"; renaming an option
 *    label never rewrites its value.
 *  · Unknown field types render a generic editable card and are exported
 *    intact — never dropped, never crash.
 */

/* ── field-type metadata ─────────────────────────────────────────────── */

export const TYPE_META = {
  "radio-group": { label: "Opción única", icon: MdRadioButtonChecked, options: true },
  "checkbox-group": { label: "Casillas", icon: MdCheckBox, options: true },
  select: { label: "Selección", icon: MdOutlineArrowDropDownCircle, options: true },
  text: { label: "Texto corto", icon: MdShortText, placeholder: true },
  textarea: { label: "Texto largo", icon: MdNotes, placeholder: true },
  number: { label: "Número", icon: MdTag },
  date: { label: "Fecha", icon: MdOutlineCalendarMonth },
  header: { label: "Título", icon: MdTitle, structural: true },
  paragraph: { label: "Descripción", icon: MdOutlineSubject, structural: true },
};

const OPTION_TYPES = new Set(["radio-group", "checkbox-group", "select"]);
const PLACEHOLDER_TYPES = new Set(["text", "textarea"]);
const STRUCTURAL_TYPES = new Set(["header", "paragraph"]);

const DEFAULT_LABELS = {
  "radio-group": "Pregunta de opción única",
  "checkbox-group": "Pregunta de casillas",
  select: "Pregunta de selección",
  text: "Pregunta de texto corto",
  textarea: "Pregunta de texto largo",
  number: "Pregunta numérica",
  date: "Pregunta de fecha",
  header: "Título de sección",
  paragraph: "Texto descriptivo",
};

const PALETTE_QUESTIONS = [
  { type: "radio-group", hint: <span className="text-xs text-gray-400">escala</span> },
  { type: "checkbox-group" },
  { type: "select" },
  { type: "text" },
  { type: "textarea", hint: <span className="text-xs font-semibold text-teal-600">IA</span> },
  { type: "number" },
  { type: "date" },
];
const PALETTE_STRUCTURE = [{ type: "header" }, { type: "paragraph" }];

/* ── hydrate / export (formBuilder JSON ⇄ builder state) ─────────────── */

let uidSeq = 0;
let nameSeq = 0;

function hydrateValues(f) {
  if (Array.isArray(f.values)) return f.values.map((v) => ({ ...v }));
  // campo de opciones malformado: el editor reconstruye sus opciones ([])
  return OPTION_TYPES.has(f.type) ? [] : null;
}

export function hydrateQuestions(rawQuestions) {
  let list = rawQuestions;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch (e) {
      list = [];
    }
  }
  if (!Array.isArray(list)) list = [];
  return list
    .filter((f) => f && typeof f === "object")
    .map((f) => ({
      uid: `q${++uidSeq}`,
      raw: f, // ORIGINAL object — spread back on export, never mutated
      type: f.type || "",
      label: f.label == null ? "" : String(f.label),
      name: f.name,
      required: !!f.required,
      values: hydrateValues(f),
      placeholder: f.placeholder == null ? "" : String(f.placeholder),
    }));
}

export function exportQuestions(fields) {
  return fields.map((q) => {
    const out = { ...q.raw };
    out.label = q.label;
    if (!STRUCTURAL_TYPES.has(q.type)) {
      if (q.required) out.required = true;
      else delete out.required; // formBuilder omits required:false
    }
    if (OPTION_TYPES.has(q.type) && Array.isArray(q.values)) {
      out.values = q.values.map((v) => ({ ...v }));
    }
    if (PLACEHOLDER_TYPES.has(q.type)) {
      if (q.placeholder) out.placeholder = q.placeholder;
      else delete out.placeholder;
    }
    return out;
  });
}

export function newField(type) {
  const name = `${type}-${Date.now()}-${++nameSeq}`;
  const label = DEFAULT_LABELS[type] || "Nueva pregunta";
  const raw = { type, label, name };
  if (type === "header") raw.subtype = "h2";
  else if (type === "paragraph") raw.subtype = "p";
  // No form-control on option groups: formRender copies className onto EVERY
  // option <input>, and index.css forces input.form-control to 46px, which
  // stretches each radio/checkbox on the public page. Legacy formBuilder
  // fields don't carry it on groups either. select/text/etc. do want it.
  else if (type !== "radio-group" && type !== "checkbox-group")
    raw.className = "form-control";
  let values = null;
  if (OPTION_TYPES.has(type)) {
    values = [1, 2, 3].map((n) => ({ label: `Opción ${n}`, value: `option-${n}` }));
    raw.values = values.map((v) => ({ ...v }));
  }
  return {
    uid: `q${++uidSeq}`,
    raw,
    type,
    label,
    name,
    required: false,
    values,
    placeholder: "",
  };
}

function duplicateField(q) {
  const raw = JSON.parse(JSON.stringify(q.raw));
  const name = `${q.type || "field"}-${Date.now()}-${++nameSeq}`;
  raw.name = name; // a copy is a NEW question: fresh name so answers never merge
  return {
    ...q,
    uid: `q${++uidSeq}`,
    raw,
    name,
    values: Array.isArray(q.values) ? q.values.map((v) => ({ ...v })) : q.values,
  };
}

function nextOptionValue(values) {
  let max = 0;
  values.forEach((v) => {
    const m = /^option-(\d+)$/.exec(String(v.value || ""));
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  });
  return `option-${Math.max(max, values.length) + 1}`;
}

/* Helpers puros de opciones a nivel de módulo: mantienen los callbacks de
   setFields planos (sin anidar map dentro de map dentro del componente). */
function renameOption(fields, uid, index, label) {
  return fields.map((f) => {
    if (f.uid !== uid || !Array.isArray(f.values)) return f;
    // Only the label changes — the value stays so stored answers keep matching.
    const values = f.values.map((v, i) => (i === index ? { ...v, label } : v));
    return { ...f, values };
  });
}

function removeOption(fields, uid, index) {
  return fields.map((f) => {
    if (f.uid !== uid || !Array.isArray(f.values) || f.values.length <= 1) return f;
    return { ...f, values: f.values.filter((_, i) => i !== index) };
  });
}

/* ── small shared bits ───────────────────────────────────────────────── */

const fakeBoxCls =
  "flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-3 text-base text-gray-400 dark:border-white/10";
const realInputCls =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-base text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white";

function typeMeta(type) {
  return TYPE_META[type] || null;
}

/* ── read-only preview of a field inside the canvas card ─────────────── */

function CanvasPreview({ q }) {
  switch (q.type) {
    case "radio-group":
    case "checkbox-group":
      return (
        <div className="mt-3 flex flex-col gap-2.5">
          {/* v.value es estable y único dentro del campo (renombrar no lo toca) */}
          {(q.values || []).map((v) => (
            <div key={v.value} className="flex items-center gap-2.5">
              <span
                className={`h-[18px] w-[18px] shrink-0 border-2 border-gray-300 ${
                  q.type === "radio-group" ? "rounded-full" : "rounded-md"
                }`}
              />
              <span className="text-base text-navy-700 dark:text-white">{v.label}</span>
            </div>
          ))}
        </div>
      );
    case "select":
      return (
        <div className={`mt-3 ${fakeBoxCls}`}>
          <span>Selecciona una opción…</span>
          <MdKeyboardArrowDown className="h-5 w-5 shrink-0" />
        </div>
      );
    case "text":
      return <div className={`mt-3 ${fakeBoxCls}`}>{q.placeholder || "Respuesta corta…"}</div>;
    case "textarea":
      return (
        <div className="mt-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-3.5 py-4 text-base text-gray-400 dark:border-white/10 dark:bg-navy-900/50">
          {q.placeholder || "Respuesta larga del asistente…"}
        </div>
      );
    case "number":
      return <div className={`mt-3 ${fakeBoxCls}`}>0</div>;
    case "date":
      return (
        <div className={`mt-3 ${fakeBoxCls}`}>
          <span>dd/mm/aaaa</span>
          <MdOutlineCalendarMonth className="h-5 w-5 shrink-0" />
        </div>
      );
    case "header":
    case "paragraph":
      return null;
    default:
      // Unknown/legacy type: generic placeholder, the raw field is preserved.
      return <div className={`mt-3 ${fakeBoxCls}`}>Campo "{q.type || "desconocido"}"</div>;
  }
}

/* Cuerpo de la tarjeta cuando NO está seleccionada, según el tipo. */
function CollapsedBody({ q }) {
  if (q.type === "header") {
    return (
      <h4 className="text-lg font-bold text-navy-700 dark:text-white">
        {q.label || <span className="font-normal text-gray-400">Título sin texto</span>}
      </h4>
    );
  }
  if (q.type === "paragraph") {
    return (
      <p className="text-base text-gray-500">
        {q.label || <span className="text-gray-400">Descripción sin texto</span>}
      </p>
    );
  }
  return (
    <>
      <p className="text-base font-semibold text-navy-700 dark:text-white">
        {q.label || <span className="font-normal text-gray-400">Pregunta sin texto</span>}
      </p>
      <CanvasPreview q={q} />
    </>
  );
}

/* ── one question card (view + edit modes) ───────────────────────────── */

function QuestionCard({
  q,
  index,
  selected,
  canEdit,
  eventId,
  cardRef,
  onSelect,
  onDeselect,
  onPatch,
  onDuplicate,
  onDelete,
  onOptionChange,
  onOptionAdd,
  onOptionRemove,
  onHandleDragStart,
  onHandleDragEnd,
  onCardDragOver,
  onCardDrop,
  dragging,
}) {
  const meta = typeMeta(q.type);
  const structural = STRUCTURAL_TYPES.has(q.type);
  const hasOptions = !!meta?.options && Array.isArray(q.values);
  const hasPlaceholder = !!meta?.placeholder;
  const TypeIcon = meta?.icon || MdHelpOutline;

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => canEdit && onSelect(q.uid)}
      // e.target === e.currentTarget: no robar Enter/Espacio de los inputs y botones internos
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          canEdit && onSelect(q.uid);
        }
      }}
      onDragOver={onCardDragOver}
      onDrop={(e) => onCardDrop(e, index)}
      // border-[transparent]: the tailwind config replaces the whole palette
      // and has no `transparent`, so the stock border-transparent class isn't
      // generated (preflight's gray fallback would show a visible 2px border).
      className={`rounded-2xl bg-white p-4 shadow-card transition dark:!bg-navy-800 ${
        selected ? "border-2 border-brand-500" : "border-2 border-[transparent]"
      } ${canEdit ? "cursor-pointer" : ""} ${dragging ? "opacity-50" : ""}`}
    >
      {/* top row: handle · order · type chips · actions */}
      <div className="flex items-center gap-2">
        <span
          draggable={canEdit}
          onDragStart={(e) => onHandleDragStart(e, index)}
          onDragEnd={onHandleDragEnd}
          className="cursor-grab text-gray-300 active:cursor-grabbing"
          title="Arrastra para reordenar"
        >
          <MdDragIndicator className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-gray-400">{index + 1}</span>
        <Chip color="gray" dot={false}>
          <TypeIcon className="h-3.5 w-3.5" />
          {meta ? meta.label : q.type || "desconocido"}
        </Chip>
        {q.type === "textarea" && (
          <Chip color="green" dot={false}>
            <MdAutoAwesome className="h-3.5 w-3.5" />
            Análisis IA
          </Chip>
        )}
        {!structural && q.required && (
          <span className="text-xs font-semibold text-brand-500">Obligatoria</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            title="Duplicar"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(q.uid);
            }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:text-navy-700 dark:hover:text-white"
          >
            <MdContentCopy className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Eliminar"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(q.uid);
            }}
            className="rounded-lg p-1.5 text-gray-400 transition hover:text-brand-500"
          >
            <MdDeleteOutline className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* body */}
      {selected ? (
        <div className="mt-3 flex flex-col gap-3">
          <TextInput
            autoFocus
            value={q.label}
            placeholder={structural ? "Escribe el texto…" : "Escribe la pregunta…"}
            onChange={(e) => onPatch(q.uid, { label: e.target.value })}
          />

          {hasOptions && (
            <div className="flex flex-col gap-2">
              {/* clave por value: es estable al escribir el label (nunca se reescribe) */}
              {q.values.map((v, i) => (
                <div key={v.value} className="flex items-center gap-2">
                  <TextInput
                    className="!h-auto !py-2 !text-sm"
                    value={v.label == null ? "" : String(v.label)}
                    onChange={(e) => onOptionChange(q.uid, i, e.target.value)}
                  />
                  <button
                    type="button"
                    title="Quitar opción"
                    disabled={q.values.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOptionRemove(q.uid, i);
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <MdClose className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOptionAdd(q.uid);
                }}
                className="self-start text-sm font-semibold text-brand-500 hover:underline"
              >
                + Añadir opción
              </button>
            </div>
          )}

          {hasPlaceholder && (
            <Field label="Placeholder (opcional)">
              <TextInput
                value={q.placeholder}
                placeholder="Texto de ayuda dentro del campo"
                onChange={(e) => onPatch(q.uid, { placeholder: e.target.value })}
              />
            </Field>
          )}

          {q.type === "textarea" && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MdInfoOutline className="h-4 w-4 shrink-0 text-teal-600" />
              <span>
                La IA agrupará los temas de estas respuestas en{" "}
                <Link
                  to={`/admin/eventos/${eventId}/encuesta-dashboard/`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-brand-500 hover:underline"
                >
                  Resultados encuesta
                </Link>
                .
              </span>
            </div>
          )}

          {/* edit footer */}
          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/10">
            {structural ? (
              <span />
            ) : (
              // Sin stopPropagation: la tarjeta ya está seleccionada (el pie solo
              // se ve en edición), así que el clic que burbujea re-selecciona el
              // mismo uid (no-op) y su onKeyDown ignora eventos burbujeados.
              <label className="flex cursor-pointer items-center gap-2">
                <span className="text-sm text-navy-700 dark:text-white">Obligatoria</span>
                <Toggle
                  checked={q.required}
                  onChange={(v) => onPatch(q.uid, { required: v })}
                />
              </label>
            )}
            <SecondaryButton
              onClick={(e) => {
                e.stopPropagation();
                onDeselect();
              }}
            >
              Listo
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <CollapsedBody q={q} />
        </div>
      )}
    </div>
  );
}

/* ── palette ─────────────────────────────────────────────────────────── */

function PaletteItem({ type, hint, canEdit, onAdd }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    // Botón nativo (accesible); el preventDefault del onKeyDown evita que la
    // activación nativa de Enter/Espacio dispare onAdd dos veces.
    <button
      type="button"
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.setData("eventflow/palette", type);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => onAdd(type)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(type);
        }
      }}
      className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 px-3.5 py-2.5 transition hover:border-brand-500 hover:bg-red-50 dark:border-white/10"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-navy-700 dark:bg-navy-700 dark:text-white">
          <Icon size={18} />
        </span>
        <span className="text-sm font-medium text-navy-700 dark:text-white">{meta.label}</span>
      </div>
      {hint || null}
    </button>
  );
}

/* ── "Preguntas" tab: canvas + palette ───────────────────────────────── */

export function QuestionsTab({ fields, setFields, selectedUid, setSelectedUid, canEdit, eventId }) {
  const [dragIndex, setDragIndex] = React.useState(null);
  const [dropActive, setDropActive] = React.useState(false);
  const cardRefs = React.useRef({});
  const scrollToRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollToRef.current) {
      cardRefs.current[scrollToRef.current]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      scrollToRef.current = null;
    }
  }, [fields]);

  const dndValid = (e) => {
    const types = new Set(e.dataTransfer?.types || []);
    return types.has("eventflow/palette") || types.has("eventflow/move");
  };

  function addQuestion(type, atIndex = null) {
    if (!canEdit) return;
    const q = newField(type);
    setFields((prev) => {
      const next = [...prev];
      if (atIndex === null || atIndex >= next.length) next.push(q);
      else next.splice(Math.max(0, atIndex), 0, q);
      return next;
    });
    setSelectedUid(q.uid);
    scrollToRef.current = q.uid;
  }

  function moveField(from, to /* null = end */) {
    if (!canEdit || Number.isNaN(from)) return;
    setFields((prev) => {
      if (from < 0 || from >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      let at = to === null || to > next.length ? next.length : to;
      if (to !== null && from < to) at = to - 1;
      next.splice(at, 0, item);
      return next;
    });
  }

  function patchField(uid, patch) {
    if (!canEdit) return;
    setFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, ...patch } : f)));
  }

  function deleteField(uid) {
    if (!canEdit) return;
    setFields((prev) => prev.filter((f) => f.uid !== uid));
    if (selectedUid === uid) setSelectedUid(null);
  }

  function duplicate(uid) {
    if (!canEdit) return;
    setFields((prev) => {
      const i = prev.findIndex((f) => f.uid === uid);
      if (i === -1) return prev;
      const next = [...prev];
      next.splice(i + 1, 0, duplicateField(prev[i]));
      return next;
    });
  }

  function optionChange(uid, index, label) {
    if (!canEdit) return;
    setFields((prev) => renameOption(prev, uid, index, label));
  }

  function optionAdd(uid) {
    if (!canEdit) return;
    setFields((prev) =>
      prev.map((f) => {
        if (f.uid !== uid || !Array.isArray(f.values)) return f;
        const values = [
          ...f.values,
          { label: `Opción ${f.values.length + 1}`, value: nextOptionValue(f.values) },
        ];
        return { ...f, values };
      })
    );
  }

  function optionRemove(uid, index) {
    if (!canEdit) return;
    setFields((prev) => removeOption(prev, uid, index));
  }

  function handleDragStart(e, index) {
    e.stopPropagation();
    e.dataTransfer.setData("eventflow/move", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDragIndex(index);
  }

  function handleCardDrop(e, index) {
    if (!canEdit) return;
    e.preventDefault();
    e.stopPropagation();
    const paletteType = e.dataTransfer.getData("eventflow/palette");
    if (paletteType) {
      addQuestion(paletteType, index); // insert BEFORE this card
    } else {
      const from = e.dataTransfer.getData("eventflow/move");
      if (from !== "") moveField(Number.parseInt(from, 10), index);
    }
    setDragIndex(null);
  }

  function handleZoneDrop(e) {
    if (!canEdit) return;
    e.preventDefault();
    setDropActive(false);
    const paletteType = e.dataTransfer.getData("eventflow/palette");
    if (paletteType) {
      addQuestion(paletteType);
    } else {
      const from = e.dataTransfer.getData("eventflow/move");
      if (from !== "") moveField(Number.parseInt(from, 10), null);
    }
    setDragIndex(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {/* canvas */}
      <div className="flex flex-col gap-4 xl:col-span-2">
        {fields.map((q, index) => (
          <QuestionCard
            key={q.uid}
            q={q}
            index={index}
            selected={selectedUid === q.uid}
            canEdit={canEdit}
            eventId={eventId}
            cardRef={(el) => (cardRefs.current[q.uid] = el)}
            onSelect={setSelectedUid}
            onDeselect={() => setSelectedUid(null)}
            onPatch={patchField}
            onDuplicate={duplicate}
            onDelete={deleteField}
            onOptionChange={optionChange}
            onOptionAdd={optionAdd}
            onOptionRemove={optionRemove}
            onHandleDragStart={handleDragStart}
            onHandleDragEnd={() => setDragIndex(null)}
            onCardDragOver={(e) => {
              if (canEdit && dndValid(e)) e.preventDefault();
            }}
            onCardDrop={handleCardDrop}
            dragging={dragIndex === index}
          />
        ))}

        {/* dropzone — always last */}
        <div
          onDragOver={(e) => {
            if (canEdit && dndValid(e)) {
              e.preventDefault();
              setDropActive(true);
            }
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleZoneDrop}
          className={`flex items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-5 text-center text-base transition ${
            dropActive
              ? "border-brand-500 bg-red-50 text-brand-500"
              : "border-gray-200 text-gray-400 dark:border-white/10"
          }`}
        >
          <MdAdd className="pointer-events-none h-5 w-5 shrink-0" />
          <span className="pointer-events-none">
            {fields.length === 0
              ? "Añade tu primera pregunta desde la paleta"
              : "Arrastra un tipo aquí o haz clic en la paleta para añadir una pregunta"}
          </span>
        </div>
      </div>

      {/* palette */}
      <div className="sticky top-4 self-start">
        <Card title="Tipos de pregunta" subtitle="Arrastra al lienzo o haz clic para añadir.">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            Preguntas
          </p>
          <div className="flex flex-col gap-2">
            {PALETTE_QUESTIONS.map((it) => (
              <PaletteItem
                key={it.type}
                type={it.type}
                hint={it.hint}
                canEdit={canEdit}
                onAdd={addQuestion}
              />
            ))}
          </div>

          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Estructura
          </p>
          <div className="flex flex-col gap-2">
            {PALETTE_STRUCTURE.map((it) => (
              <PaletteItem key={it.type} type={it.type} canEdit={canEdit} onAdd={addQuestion} />
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-teal-50 p-3.5 text-sm text-teal-900 dark:bg-teal-900/20 dark:text-teal-200">
            Usa <b>Opción única</b> para escalas de satisfacción y <b>Texto largo</b> para
            comentarios abiertos — la IA los analiza.
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── "Vista previa" modal ────────────────────────────────────────────── */

function PreviewField({ q }) {
  if (q.type === "header") {
    return <h4 className="text-xl font-bold text-navy-700 dark:text-white">{q.label}</h4>;
  }
  if (q.type === "paragraph") {
    return <p className="text-base text-gray-500">{q.label}</p>;
  }

  let control;
  switch (q.type) {
    case "radio-group":
    case "checkbox-group":
      control = (
        <div className="flex flex-col gap-2.5">
          {(q.values || []).map((v) => (
            <label
              key={v.value}
              className="flex cursor-pointer items-center gap-2.5 text-base text-navy-700 dark:text-white"
            >
              <input
                type={q.type === "radio-group" ? "radio" : "checkbox"}
                name={q.name || q.uid}
                value={v.value}
                className="h-[18px] w-[18px] shrink-0 accent-brand-500"
              />
              {v.label}
            </label>
          ))}
        </div>
      );
      break;
    case "select":
      control = (
        <select className={realInputCls} defaultValue="">
          <option value="" disabled>
            Selecciona una opción…
          </option>
          {(q.values || []).map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      );
      break;
    case "text":
      control = <TextInput placeholder={q.placeholder || ""} />;
      break;
    case "textarea":
      control = <TextArea rows={3} placeholder={q.placeholder || ""} />;
      break;
    case "number":
      control = <TextInput type="number" placeholder={q.placeholder || "0"} />;
      break;
    case "date":
      control = <TextInput type="date" />;
      break;
    default:
      control = <TextInput disabled placeholder={`Campo ${q.type || "desconocido"}`} />;
  }

  return (
    <div>
      <p className="mb-2 text-base font-semibold text-navy-700 dark:text-white">
        {q.label}
        {q.required && <span className="text-brand-500"> *</span>}
      </p>
      {control}
    </div>
  );
}

export function PreviewModal({ fields, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="button"
      tabIndex={0}
      // e.target === e.currentTarget: solo el fondo cierra; los clics y teclas
      // dentro del contenido (inputs de la vista previa) no cierran el modal.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:!bg-navy-800">
        <button
          type="button"
          title="Cerrar"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition hover:text-navy-700 dark:hover:text-white"
        >
          <MdClose className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-bold text-navy-700 dark:text-white">Vista previa</h3>
        <p className="mt-0.5 text-sm text-gray-500">Así verán la encuesta los asistentes.</p>
        <div className="mt-5 flex flex-col gap-5">
          {fields.length === 0 ? (
            <p className="text-base text-gray-400">Aún no hay preguntas.</p>
          ) : (
            fields.map((q) => <PreviewField key={q.uid} q={q} />)
          )}
        </div>
      </div>
    </div>
  );
}
