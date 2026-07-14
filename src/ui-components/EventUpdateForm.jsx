/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Autocomplete,
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  Icon,
  ScrollView,
  SelectField,
  SwitchField,
  Text,
  TextAreaField,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Field } from "@aws-amplify/ui-react/internal";
import { StorageManager } from "@aws-amplify/ui-react-storage";
import { Event, Badge as Badge0 } from "../models";
import {
  fetchByPath,
  getOverrideProps,
  processFile,
  useDataStoreBinding,
  validateField,
} from "./utils";
import { DataStore } from "aws-amplify/datastore";
import { generateClient } from "aws-amplify/api";
import TestCertificate from "components/TestCertificate";
import CertificatePreview from "components/CertificatePreview";
// Query mínima (sin relaciones anidadas): en este proyecto Landing/Form
// resuelven raro vía getEvent generado, y aquí solo se necesitan los campos
// planos del formulario.
const GET_EVENT_FOR_FORM = /* GraphQL */ `
  query GetEventForForm($id: ID!) {
    getEvent(id: $id) {
      id
      title
      description
      date
      startDate
      endDate
      timezone
      sendCertificates
      certificate
      certificatePosition
      certificatesSentAt
      termsCondition
      maxRegs
      totalScannedTicket
      contactTemplate
      usuarioUSFQ
      eventIdUSFQ
      periodoUSFQ
      _version
      _deleted
      _lastChangedAt
    }
  }
`;
// Limpia la marca de "certificados enviados" para habilitar un reenvío. El
// `null` de GraphQL BORRA el atributo en DynamoDB (verificado), de modo que el
// filtro `attribute_not_exists(certificatesSentAt)` del Lambda vuelve a tomar
// el evento en el siguiente ciclo. _version es obligatorio (conflict handling).
const CLEAR_CERT_SENT = /* GraphQL */ `
  mutation ClearCertSent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
      id
      certificatesSentAt
      _version
    }
  }
`;
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function EventUpdateForm(props) {
  const {
    id: idProp,
    event: eventModelProp,
    onSuccess,
    onError,
    onSubmit,
    onCancel,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    title: "",
    description: "",
    date: "",
    startDate: "",
    endDate: "",
    timezone: "America/Guayaquil",
    sendCertificates: false,
    certificate: "",
    certificatePosition: "",
    termsCondition: "",
    maxRegs: "",
    totalScannedTicket: "",
    contactTemplate: "",
    Badge: undefined,
    usuarioUSFQ: "",
    eventIdUSFQ: "",
    periodoUSFQ: "",
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [date, setDate] = React.useState(initialValues.date);
  const [startDate, setStartDate] = React.useState(initialValues.startDate);
  const [endDate, setEndDate] = React.useState(initialValues.endDate);
  const [timezone, setTimezone] = React.useState(initialValues.timezone);
  const [sendCertificates, setSendCertificates] = React.useState(
    initialValues.sendCertificates
  );
  const [certificate, setCertificate] = React.useState(
    initialValues.certificate
  );
  const [certificatePosition, setCertificatePosition] = React.useState(
    initialValues.certificatePosition
  );
  const [termsCondition, setTermsCondition] = React.useState(
    initialValues.termsCondition
  );
  const [maxRegs, setMaxRegs] = React.useState(initialValues.maxRegs);
  const [totalScannedTicket, setTotalScannedTicket] = React.useState(
    initialValues.totalScannedTicket
  );
  const [contactTemplate, setContactTemplate] = React.useState(
    initialValues.contactTemplate
  );
  const [Badge, setBadge] = React.useState(initialValues.Badge);
  const [usuarioUSFQ, setUsuarioUSFQ] = React.useState(
    initialValues.usuarioUSFQ
  );
  const [eventIdUSFQ, setEventIdUSFQ] = React.useState(
    initialValues.eventIdUSFQ
  );
  const [periodoUSFQ, setPeriodoUSFQ] = React.useState(
    initialValues.periodoUSFQ
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = eventRecord
      ? { ...initialValues, ...eventRecord, ...(cloudOverrides || {}), Badge }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setDate(cleanValues.date);
    setStartDate(cleanValues.startDate);
    setEndDate(cleanValues.endDate);
    setTimezone(cleanValues.timezone);
    setSendCertificates(cleanValues.sendCertificates);
    // No pisar lo que el admin ya tocó en ESTA sesión: los resets también
    // llegan tarde (hidratación de nube, cambio de Badge) y antes revertían el
    // panel del certificado en plena edición — el "se resetea" reportado. Las
    // claves NO tocadas sí adoptan el valor entrante (p. ej. otra pestaña
    // cambió el color).
    if (!certKeyTouchedRef.current) {
      setCertificate(cleanValues.certificate);
    }
    let nextCertPos = cleanValues.certificatePosition;
    if (dirtyCertKeysRef.current.size > 0) {
      const incoming = normalizeCertCfg(nextCertPos);
      const local = normalizeCertCfg(certPosRef.current);
      dirtyCertKeysRef.current.forEach((k) => {
        if (local[k] !== undefined) incoming[k] = local[k];
      });
      nextCertPos = JSON.stringify(incoming);
      certPosRef.current = nextCertPos;
    }
    setCertificatePosition(nextCertPos);
    setTermsCondition(cleanValues.termsCondition);
    setMaxRegs(cleanValues.maxRegs);
    setTotalScannedTicket(cleanValues.totalScannedTicket);
    setContactTemplate(cleanValues.contactTemplate);
    setBadge(cleanValues.Badge);
    setCurrentBadgeValue(undefined);
    setCurrentBadgeDisplayValue("");
    setUsuarioUSFQ(cleanValues.usuarioUSFQ);
    setEventIdUSFQ(cleanValues.eventIdUSFQ);
    setPeriodoUSFQ(cleanValues.periodoUSFQ);
    setErrors({});
  };
  const [eventRecord, setEventRecord] = React.useState(eventModelProp);
  // La copia local de DataStore (IndexedDB / estado de una pestaña vieja) puede
  // quedar DETRÁS de la nube aunque los guardados sí lleguen. Si el formulario
  // se hidrata de esa copia vieja, el siguiente ajuste del certificado
  // re-escribe el JSON completo con valores viejos y "resetea" lo ya guardado.
  // Por eso el estado del formulario se hidrata desde getEvent (nube), con la
  // copia local solo como respaldo sin red. Mismo patrón que la encuesta
  // pública (GraphQL directo en vez de DataStore). OJO: los valores de nube
  // van a estado React (cloudOverrides), NUNCA a un Event.copyOf — un copyOf
  // de hidratación registra patches que DataStore fusiona en cada guardado
  // posterior y re-enviaría a la nube todos esos campos con valores del
  // momento del montaje.
  const gqlClient = React.useMemo(() => generateClient(), []);
  const CLOUD_HYDRATED_FIELDS = [
    "title",
    "description",
    "date",
    "startDate",
    "endDate",
    "timezone",
    "sendCertificates",
    "certificate",
    "certificatePosition",
    "termsCondition",
    "maxRegs",
    "totalScannedTicket",
    "contactTemplate",
    "usuarioUSFQ",
    "eventIdUSFQ",
    "periodoUSFQ",
  ];
  const [cloudOverrides, setCloudOverrides] = React.useState(null);
  // Marca "certificados enviados el…" — el Lambda la escribe DIRECTO en
  // DynamoDB sin _version, así que DataStore no la ve; se lee de la nube.
  // Solo para mostrar el aviso + botón "Volver a enviar" (no es campo del form).
  const [certSentAt, setCertSentAt] = React.useState(null);
  const [resendingCert, setResendingCert] = React.useState(false);
  // true desde la primera interacción del admin: si la respuesta de getEvent
  // llega DESPUÉS de que empezó a editar, no se aplica (borraría su tecleo /
  // ajustes en curso una vuelta de red después de montar).
  const userEditedRef = React.useRef(false);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Event, idProp)
        : eventModelProp;
      setEventRecord(record);
      // Badge PRIMERO (resuelve del store local en ms): su setBadge dispara un
      // reset, y si quedara detrás del fetch de red ese reset llegaría
      // segundos tarde y borraría lo que el admin ya empezó a teclear.
      const BadgeRecord = record ? await record.Badge : undefined;
      setBadge(BadgeRecord);
      if (record?.id) {
        const cloud = await fetchCloudEvent(record.id);
        if (cloud && !cloud._deleted) {
          // Aviso de envío realizado: lectura de solo-display, sin conflicto
          // con lo que el admin esté editando.
          setCertSentAt(cloud.certificatesSentAt || null);
          if (!userEditedRef.current) {
            const overrides = {};
            CLOUD_HYDRATED_FIELDS.forEach((f) => {
              if (cloud[f] !== undefined) overrides[f] = cloud[f];
            });
            setCloudOverrides(overrides);
          }
        }
      }
    };
    queryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProp, eventModelProp]);
  React.useEffect(resetStateValues, [eventRecord, Badge, cloudOverrides]);
  const [currentBadgeDisplayValue, setCurrentBadgeDisplayValue] =
    React.useState("");
  const [currentBadgeValue, setCurrentBadgeValue] = React.useState(undefined);
  const BadgeRef = React.createRef();
  const getIDValue = {
    Badge: (r) => JSON.stringify({ id: r?.id }),
  };
  const BadgeIdSet = new Set(
    Array.isArray(Badge)
      ? Badge.map((r) => getIDValue.Badge?.(r))
      : getIDValue.Badge?.(Badge)
  );
  const badgeRecords = useDataStoreBinding({
    type: "collection",
    model: Badge0,
  }).items;
  const getDisplayValue = {
    Badge: (r) => `${r?.frontDesign ? r?.frontDesign + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [{ type: "Required" }],
    description: [],
    date: [],
    startDate: [],
    endDate: [],
    timezone: [],
    sendCertificates: [],
    certificate: [],
    certificatePosition: [],
    termsCondition: [{ type: "Required" }],
    maxRegs: [],
    totalScannedTicket: [],
    contactTemplate: [],
    Badge: [],
    usuarioUSFQ: [],
    eventIdUSFQ: [],
    periodoUSFQ: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  // Show/edit the datetime in the EVENT's timezone (not the browser's), so the
  // wall clock typed by the admin matches the venue. Fixed offset (no DST).
  const eventTzOffset =
    timezone === "Pacific/Galapagos" ? "-06:00" : "-05:00";
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
      timeZone: timezone || "America/Guayaquil",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  // El revisor de certificados corre cada 5 minutos en punto (:00, :05, :10…).
  // La hora configurada se respeta como "no antes de"; este helper calcula el
  // ciclo real en que saldrá el envío para mostrárselo al admin junto al campo.
  const SEND_CYCLE_MS = 5 * 60000;
  const sendSlotLabel = (iso) => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const slot = new Date(Math.ceil(t / SEND_CYCLE_MS) * SEND_CYCLE_MS);
    return convertToLocal(slot).replace("T", ", ");
  };
  // Certificate name styling/placement lives in certificatePosition as JSON:
  // { xPct, yPct, fontPct, color, sendAt }. Backward compatible with the old
  // preset string / { preset } object (mapped to xPct/yPct here).
  const CERT_PRESETS = {
    centro: { xPct: 50, yPct: 50 },
    "centro-arriba": { xPct: 50, yPct: 30 },
    "centro-abajo": { xPct: 50, yPct: 70 },
    "inferior-izquierda": { xPct: 28, yPct: 85 },
    "inferior-derecha": { xPct: 72, yPct: 85 },
  };
  const certSettings = (() => {
    const defaults = {
      xPct: 50,
      yPct: 50,
      fontPct: 6,
      color: "#1a1a1a",
      sendAt: "",
    };
    try {
      // AWSJSON: DataStore hydrates this field as a parsed OBJECT, while our
      // own edits store a JSON string — tolerate both. (JSON.parse of an
      // object throws, which silently reset the panel to defaults on every
      // load and made saved settings look like they never persisted.)
      // Preset crudo sin comillas ("centro"): tampoco es JSON válido.
      if (
        typeof certificatePosition === "string" &&
        CERT_PRESETS[certificatePosition.trim()]
      ) {
        const p = CERT_PRESETS[certificatePosition.trim()];
        return { ...defaults, xPct: p.xPct, yPct: p.yPct };
      }
      const v =
        typeof certificatePosition === "string"
          ? JSON.parse(certificatePosition || "{}")
          : certificatePosition || {};
      if (typeof v === "string" && v) {
        const p = CERT_PRESETS[v] || CERT_PRESETS.centro;
        return { ...defaults, xPct: p.xPct, yPct: p.yPct };
      }
      if (v && typeof v === "object") {
        let xPct = v.xPct;
        let yPct = v.yPct;
        if (xPct == null || yPct == null) {
          const p = CERT_PRESETS[v.preset] || CERT_PRESETS.centro;
          xPct = p.xPct;
          yPct = p.yPct;
        }
        return {
          xPct: Number(xPct),
          yPct: Number(yPct),
          fontPct: v.fontPct ?? 6,
          color: v.color || "#1a1a1a",
          sendAt: v.sendAt || "",
        };
      }
    } catch (e) {
      /* fall through to defaults */
    }
    return defaults;
  })();
  // Claves del JSON del certificado que el admin tocó en ESTA sesión. Al
  // persistir se mezclan SOLO esas claves sobre la config más fresca de la
  // nube: así una pestaña/carga con datos viejos nunca pisa las claves que no
  // tocó (el "puse tamaño pequeño y se reseteó").
  const dirtyCertKeysRef = React.useRef(new Set());
  // true si en esta sesión se subió/quitó la plantilla (protege la clave del
  // archivo de los resets tardíos, igual que dirtyCertKeysRef al JSON).
  const certKeyTouchedRef = React.useRef(false);
  // Config del certificado a objeto plano con xPct/yPct SIEMPRE explícitos:
  // los eventos viejos guardan un preset ("centro", '"inferior-derecha"' o
  // {preset}), y si el merge partiera de {} les destruiría la posición.
  const normalizeCertCfg = (v) => {
    let parsed;
    if (typeof v === "string") {
      const s = v.trim();
      // Preset crudo sin comillas JSON ("centro") — registros muy viejos:
      // JSON.parse lo rechazaría y se perdería la posición.
      if (CERT_PRESETS[s]) {
        const p = CERT_PRESETS[s];
        return { xPct: p.xPct, yPct: p.yPct };
      }
      try {
        parsed = JSON.parse(s || "{}");
      } catch (e) {
        return {};
      }
    } else {
      parsed = v || {};
    }
    if (typeof parsed === "string" && parsed) {
      const p = CERT_PRESETS[parsed] || CERT_PRESETS.centro;
      return { xPct: p.xPct, yPct: p.yPct };
    }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if ((parsed.xPct == null || parsed.yPct == null) && parsed.preset) {
        const p = CERT_PRESETS[parsed.preset] || CERT_PRESETS.centro;
        const { preset, ...rest } = parsed;
        return { ...rest, xPct: p.xPct, yPct: p.yPct };
      }
      // Copia SIEMPRE: puede ser el objeto CONGELADO del modelo DataStore
      // (immer autoFreeze) y los llamadores lo mutan (overlay del reset).
      return { ...parsed };
    }
    return {};
  };
  // Lectura fresca del evento con timeout (una conexión colgada no debe
  // retrasar el guardado local) y rescate de data parcial: el cliente v6
  // RECHAZA la promesa ante cualquier error GraphQL aunque data venga poblada.
  const fetchCloudEvent = async (id) => {
    const op = gqlClient.graphql({
      query: GET_EVENT_FOR_FORM,
      variables: { id },
    });
    const timer = setTimeout(() => {
      try {
        gqlClient.cancel(op, "timeout getEvent");
      } catch (e) {
        /* cancel best-effort */
      }
    }, 4000);
    try {
      const { data } = await op;
      return data?.getEvent ?? null;
    } catch (e) {
      const partial = e?.data?.getEvent;
      if (partial) {
        console.warn(
          "EventUpdateForm: getEvent con errores parciales; usando data parcial:",
          e?.errors
        );
        return partial;
      }
      console.warn(
        "EventUpdateForm: getEvent falló (red / API key / throttling); usando copia local:",
        e?.errors ?? e
      );
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
  // _version más reciente visto en la nube: viaja en el save para que
  // AUTOMERGE no arbitre (y descarte) el merge que acabamos de calcular.
  const cloudVersionRef = React.useRef(null);
  const mergeCertWithCloud = async (posJson) => {
    const cloud = eventRecord?.id ? await fetchCloudEvent(eventRecord.id) : null;
    if (cloud?._version != null) cloudVersionRef.current = cloud._version;
    if (cloud && !cloud._deleted && cloud.certificatePosition != null) {
      const merged = { ...normalizeCertCfg(cloud.certificatePosition) };
      const localCfg = normalizeCertCfg(posJson);
      dirtyCertKeysRef.current.forEach((k) => {
        if (localCfg[k] !== undefined) merged[k] = localCfg[k];
      });
      return JSON.stringify(merged);
    }
    // Sin nube (offline/primera config): valor local tal cual, sin inventar
    // "{}" donde antes iba "" o null.
    if (typeof posJson === "string" || posJson == null) return posJson;
    return JSON.stringify(normalizeCertCfg(posJson));
  };
  // Auto-save just the certificate fields so uploading/adjusting persists
  // WITHOUT clicking Update (you can test right away).
  const persistCertNow = async (cert) => {
    if (!eventRecord) return;
    try {
      // Valor más nuevo AL EJECUTAR (la cola puede retrasar esta llamada
      // respecto al commit que la disparó): así el último commit siempre gana.
      const localJson = certPosRef.current;
      const next = await mergeCertWithCloud(localJson);
      // Base recién consultada: nunca guardar sobre una instancia vieja ni
      // sobre una con patches de hidratación (re-enviaría campos del montaje).
      const base =
        (await DataStore.query(Event, eventRecord.id)) || eventRecord;
      await DataStore.save(
        Event.copyOf(base, (u) => {
          u.certificate = cert;
          u.certificatePosition = next;
          u.sendCertificates = true;
          if (
            cloudVersionRef.current != null &&
            cloudVersionRef.current > (base._version ?? 0)
          ) {
            u._version = cloudVersionRef.current;
          }
        })
      );
      // Reflejar en la UI el resultado del merge (p. ej. otra pestaña cambió
      // el color) — solo si nadie editó mientras el guardado estaba en vuelo.
      if (
        typeof next === "string" &&
        next !== localJson &&
        certPosRef.current === localJson
      ) {
        certPosRef.current = next;
        setCertificatePosition(next);
      }
    } catch (e) {
      console.error("auto-save certificate:", e);
    }
  };
  // Cola: los persist se ejecutan EN ORDEN de commit. Sin ella, dos commits
  // rápidos con fetches de latencia distinta pueden guardarse invertidos y el
  // valor viejo queda último en la nube.
  const persistQueueRef = React.useRef(Promise.resolve());
  const persistCert = (cert) => {
    const run = persistQueueRef.current.then(() => persistCertNow(cert));
    persistQueueRef.current = run.catch(() => {});
    return run;
  };
  // "Volver a enviar": limpia la marca certificatesSentAt en la nube para que
  // el revisor reenvíe en el próximo ciclo. _version fresco (obligatorio para
  // el conflict handling de AppSync) desde la lectura previa.
  const fmtSentAt = (v) => {
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d.toLocaleString("es-EC") : "";
  };
  const resendCertificates = async () => {
    if (!eventRecord?.id || resendingCert) return;
    const whenTxt = fmtSentAt(certSentAt);
    const ok = window.confirm(
      `Los certificados ya se enviaron${
        whenTxt ? ` el ${whenTxt}` : ""
      }.\n\n¿Volver a habilitarlos? Se reenviarán a TODOS los inscritos que pidieron certificado, en el próximo ciclo (cada 5 minutos), según la fecha programada.`
    );
    if (!ok) return;
    setResendingCert(true);
    try {
      const cloud = await fetchCloudEvent(eventRecord.id);
      const version = cloud?._version;
      if (version == null) {
        alert("No se pudo leer el evento. Revisa tu conexión e intenta de nuevo.");
        return;
      }
      await gqlClient.graphql({
        query: CLEAR_CERT_SENT,
        variables: {
          input: { id: eventRecord.id, certificatesSentAt: null, _version: version },
        },
      });
      setCertSentAt(null);
      alert(
        "Listo. Los certificados se reenviarán en el próximo ciclo (cada 5 minutos)."
      );
    } catch (e) {
      console.error("reenvío certificados:", e);
      alert("No se pudo habilitar el reenvío. Intenta de nuevo.");
    } finally {
      setResendingCert(false);
    }
  };
  // Commit-time persistence must NEVER read the render closure: during a
  // slider/preview drag the change events outpace React's commits, so the
  // mouseup closure can hold an INTERMEDIATE value (it saved 67% while the UI
  // already showed 73.5%). This ref is written synchronously on every change,
  // so the commit handlers always persist the freshest value.
  const certPosRef = React.useRef(certificatePosition);
  // Keep the ref in step with committed state (hydration/reset paths); the
  // synchronous write in updateCertSettings covers the burst window between
  // an input event and its React commit.
  React.useEffect(() => {
    certPosRef.current = certificatePosition;
  }, [certificatePosition]);
  const updateCertSettings = (patch, { persist = true } = {}) => {
    userEditedRef.current = true;
    Object.keys(patch).forEach((k) => dirtyCertKeysRef.current.add(k));
    const next = JSON.stringify({ ...certSettings, ...patch });
    certPosRef.current = next;
    setCertificatePosition(next);
    if (persist) persistCert(certificate);
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onChangeCapture={() => {
        userEditedRef.current = true;
      }}
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          title,
          description,
          date,
          startDate,
          endDate,
          timezone,
          sendCertificates,
          certificate,
          certificatePosition,
          termsCondition,
          maxRegs,
          totalScannedTicket,
          contactTemplate,
          Badge,
          usuarioUSFQ,
          eventIdUSFQ,
          periodoUSFQ,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(
                    fieldName,
                    item,
                    getDisplayValue[fieldName]
                  )
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(
                fieldName,
                modelFields[fieldName],
                getDisplayValue[fieldName]
              )
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          // El submit también escribe certificatePosition completo: sin este
          // merge, una pestaña con estado viejo pisaría en la nube lo que otra
          // guardó (mismo bug que persistCert). Y la base del copyOf se
          // consulta fresca para no arrastrar valores del montaje al store.
          try {
            modelFields.certificatePosition = await mergeCertWithCloud(
              certPosRef.current || modelFields.certificatePosition
            );
          } catch (e) {
            /* sin red: se envía el valor local */
          }
          const base =
            (await DataStore.query(Event, eventRecord.id)) || eventRecord;
          await DataStore.save(
            Event.copyOf(base, (updated) => {
              Object.assign(updated, modelFields);
              if (!modelFields.Badge) {
                updated.eventBadgeId = undefined;
              }
              // Igual que persistCertNow: con la versión fresca de la nube
              // AUTOMERGE no arbitra (y no descarta) el merge recién calculado.
              if (
                cloudVersionRef.current != null &&
                cloudVersionRef.current > (base._version ?? 0)
              ) {
                updated._version = cloudVersionRef.current;
              }
            })
          );
          if (onSuccess) {
            onSuccess(modelFields);
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "EventUpdateForm")}
      {...rest}
    >
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Indica a los usuarios como se llama el evento</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        placeholder="Nombre evento"
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.title ?? value;
          }
          if (errors.title?.hasError) {
            runValidationTasks("title", value);
          }
          setTitle(value);
        }}
        onBlur={() => runValidationTasks("title", title)}
        errorMessage={errors.title?.errorMessage}
        hasError={errors.title?.hasError}
        {...getOverrideProps(overrides, "title")}
      ></TextField>
      <TextField
        label="Descripción del evento"
        isRequired={false}
        isReadOnly={false}
        placeholder="De que se trata el evento?"
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description: value,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.description ?? value;
          }
          if (errors.description?.hasError) {
            runValidationTasks("description", value);
          }
          setDescription(value);
        }}
        onBlur={() => runValidationTasks("description", description)}
        errorMessage={errors.description?.errorMessage}
        hasError={errors.description?.hasError}
        {...getOverrideProps(overrides, "description")}
      ></TextField>
      <TextField
        label="Fecha y hora de inicio"
        descriptiveText="Fecha y hora en que comienza el evento"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={startDate && convertToLocal(new Date(startDate))}
        onChange={(e) => {
          let value =
            e.target.value === ""
              ? ""
              : new Date(
                  `${e.target.value.slice(0, 16)}:00${eventTzOffset}`
                ).toISOString();
          if (errors.startDate?.hasError) {
            runValidationTasks("startDate", value);
          }
          setStartDate(value);
        }}
        onBlur={() => runValidationTasks("startDate", startDate)}
        errorMessage={errors.startDate?.errorMessage}
        hasError={errors.startDate?.hasError}
        {...getOverrideProps(overrides, "startDate")}
      ></TextField>
      <TextField
        label="Fecha y hora de fin"
        descriptiveText="Fecha y hora en que termina (para eventos de varios días)"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={endDate && convertToLocal(new Date(endDate))}
        onChange={(e) => {
          let value =
            e.target.value === ""
              ? ""
              : new Date(
                  `${e.target.value.slice(0, 16)}:00${eventTzOffset}`
                ).toISOString();
          if (errors.endDate?.hasError) {
            runValidationTasks("endDate", value);
          }
          setEndDate(value);
        }}
        onBlur={() => runValidationTasks("endDate", endDate)}
        errorMessage={errors.endDate?.errorMessage}
        hasError={errors.endDate?.hasError}
        {...getOverrideProps(overrides, "endDate")}
      ></TextField>
      <SelectField
        label="Zona horaria del evento"
        descriptiveText="Las horas se muestran a todos en esta zona, con su etiqueta (ej. GMT-6). Ingresa las horas de inicio/fin en esta misma zona."
        value={timezone || "America/Guayaquil"}
        onChange={(e) => setTimezone(e.target.value)}
      >
        <option value="America/Guayaquil">Quito (GMT-5)</option>
        <option value="Pacific/Galapagos">Galápagos (GMT-6)</option>
      </SelectField>
      <SwitchField
        label="Certificados"
        descriptiveText="Al finalizar el evento se envía automáticamente un certificado por correo a cada participante, con su nombre incrustado en la plantilla."
        defaultChecked={false}
        isDisabled={false}
        isChecked={!!sendCertificates}
        onChange={(e) => {
          setSendCertificates(e.target.checked);
        }}
        {...getOverrideProps(overrides, "sendCertificates")}
      ></SwitchField>
      {sendCertificates && (
        <>
          <Field
            errorMessage={errors.certificate?.errorMessage}
            hasError={errors.certificate?.hasError}
            label={"Plantilla del certificado (imagen o PDF)"}
            descriptiveText="Sube el diseño del certificado. El nombre del participante se incrustará sobre esta plantilla."
            isRequired={false}
            isReadOnly={false}
          >
            {eventRecord && (
              <StorageManager
                defaultFiles={certificate ? [{ key: certificate }] : []}
                onUploadSuccess={({ key }) => {
                  certKeyTouchedRef.current = true;
                  setCertificate(key);
                  persistCert(key);
                }}
                onFileRemove={() => {
                  certKeyTouchedRef.current = true;
                  setCertificate(initialValues?.certificate);
                  persistCert(initialValues?.certificate);
                }}
                processFile={processFile}
                accessLevel={"public"}
                acceptedFileTypes={["image/*", ".pdf"]}
                isResumable={false}
                showThumbnails={true}
                maxFileCount={1}
                {...getOverrideProps(overrides, "certificate")}
              ></StorageManager>
            )}
          </Field>
          {certSentAt && (
            <Flex
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              wrap="wrap"
              gap="10px"
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <Flex direction="column" gap="2px">
                <Text fontSize="0.9rem" color="#065f46" fontWeight={600}>
                  ✓ Certificados enviados
                </Text>
                <Text fontSize="0.8125rem" color="#047857">
                  {fmtSentAt(certSentAt)
                    ? `El ${fmtSentAt(certSentAt)} · `
                    : ""}
                  no se reenvían solos mientras esta marca exista.
                </Text>
              </Flex>
              <button
                type="button"
                onClick={resendCertificates}
                disabled={resendingCert}
                style={{
                  background: "#fff",
                  border: "1px solid #e41b23",
                  color: "#e41b23",
                  borderRadius: 8,
                  padding: "8px 14px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: resendingCert ? "default" : "pointer",
                  opacity: resendingCert ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {resendingCert ? "Habilitando…" : "Volver a enviar"}
              </button>
            </Flex>
          )}
          <Flex direction="column" gap="10px">
            <Text fontSize="1rem" color="#304050">
              Posición del nombre
            </Text>
            <Flex direction="column" gap="2px">
              <Flex justifyContent="space-between">
                <Text fontSize="0.875rem" color="#6b7280">
                  Horizontal
                </Text>
                <Text fontSize="0.875rem" color="#304050">
                  {certSettings.xPct}%
                </Text>
              </Flex>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={certSettings.xPct}
                onChange={(e) =>
                  updateCertSettings(
                    { xPct: Number(e.target.value) },
                    { persist: false }
                  )
                }
                onMouseUp={() => persistCert(certificate)}
                onTouchEnd={() => persistCert(certificate)}
                style={{ width: "100%", accentColor: "#e41b23" }}
              />
            </Flex>
            <Flex direction="column" gap="2px">
              <Flex justifyContent="space-between">
                <Text fontSize="0.875rem" color="#6b7280">
                  Vertical
                </Text>
                <Text fontSize="0.875rem" color="#304050">
                  {certSettings.yPct}%
                </Text>
              </Flex>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={certSettings.yPct}
                onChange={(e) =>
                  updateCertSettings(
                    { yPct: Number(e.target.value) },
                    { persist: false }
                  )
                }
                onMouseUp={() => persistCert(certificate)}
                onTouchEnd={() => persistCert(certificate)}
                style={{ width: "100%", accentColor: "#e41b23" }}
              />
            </Flex>
            <Text fontSize="0.8125rem" color="#6b7280">
              Mueve los deslizadores o arrastra el nombre en la vista previa.
            </Text>
          </Flex>
          <SelectField
            label="Tamaño del nombre"
            isDisabled={false}
            value={String(certSettings.fontPct)}
            onChange={(e) =>
              updateCertSettings({ fontPct: Number(e.target.value) })
            }
          >
            <option value="4">Pequeño</option>
            <option value="6">Mediano</option>
            <option value="9">Grande</option>
          </SelectField>
          <Flex direction="column" gap="6px">
            <Text fontSize="1rem" color="#304050">
              Color del nombre
            </Text>
            <Flex alignItems="center" gap="8px" wrap="wrap">
              {["#1a1a1a", "#ffffff", "#1e3a8a", "#b45309", "#7c2d12"].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => updateCertSettings({ color: c })}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: c,
                      border:
                        (certSettings.color || "").toLowerCase() === c
                          ? "2px solid #2563eb"
                          : "1px solid #d1d5db",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  />
                )
              )}
              <input
                type="color"
                value={certSettings.color}
                title="Color personalizado"
                onChange={(e) =>
                  updateCertSettings({ color: e.target.value }, { persist: false })
                }
                onBlur={() => persistCert(certificate)}
                style={{
                  width: 34,
                  height: 26,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  background: "none",
                  cursor: "pointer",
                  padding: 2,
                }}
              />
              <Text fontSize="0.8125rem" color="#6b7280">
                {certSettings.color}
              </Text>
            </Flex>
          </Flex>
          <Flex direction="column" gap="4px">
            <Text fontSize="1rem" color="#304050">
              Enviar el certificado el (opcional)
            </Text>
            <input
              type="datetime-local"
              step={300}
              value={
                certSettings.sendAt
                  ? convertToLocal(new Date(certSettings.sendAt))
                  : ""
              }
              onChange={(e) =>
                updateCertSettings({
                  // Igual que startDate/endDate: interpretar la hora tecleada
                  // en la zona del EVENTO, no en la del navegador.
                  sendAt: e.target.value
                    ? new Date(
                        `${e.target.value.slice(0, 16)}:00${eventTzOffset}`
                      ).toISOString()
                    : "",
                })
              }
              style={{
                maxWidth: 280,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: "0.95rem",
              }}
            />
            {certSettings.sendAt && sendSlotLabel(certSettings.sendAt) ? (
              <Text fontSize="0.8125rem" color="#304050">
                Se enviará el {sendSlotLabel(certSettings.sendAt)} (hora del
                evento) — los envíos salen cada 5 minutos, en punto de :00,
                :05, :10…
              </Text>
            ) : (
              <Text fontSize="0.8125rem" color="#6b7280">
                Si lo dejas vacío, se envían automáticamente cuando termina el
                evento (en el siguiente ciclo de 5 minutos). Solo a quienes
                pidieron certificado en el formulario.
              </Text>
            )}
          </Flex>
          <CertificatePreview
            certificate={certificate}
            xPct={certSettings.xPct}
            yPct={certSettings.yPct}
            fontPct={certSettings.fontPct}
            color={certSettings.color}
            onPositionChange={(x, y) =>
              updateCertSettings({ xPct: x, yPct: y }, { persist: false })
            }
            onPositionCommit={() =>
              persistCert(certificate)
            }
          />
          <TestCertificate
            eventId={eventRecord?.id}
            certificate={certificate}
            certificatePosition={certificatePosition}
          />
        </>
      )}
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Términos y condiciones (app móvil)</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        placeholder="La siguiente información se visualizará dentro de la aplicación para los usuarios finales"
        value={termsCondition}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition: value,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.termsCondition ?? value;
          }
          if (errors.termsCondition?.hasError) {
            runValidationTasks("termsCondition", value);
          }
          setTermsCondition(value);
        }}
        onBlur={() => runValidationTasks("termsCondition", termsCondition)}
        errorMessage={errors.termsCondition?.errorMessage}
        hasError={errors.termsCondition?.hasError}
        {...getOverrideProps(overrides, "termsCondition")}
      ></TextField>
      <TextField
        label="Límite máximo de registros"
        descriptiveText="Cantidad máxima de participantes permitidos para este evento"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={maxRegs}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs: value,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.maxRegs ?? value;
          }
          if (errors.maxRegs?.hasError) {
            runValidationTasks("maxRegs", value);
          }
          setMaxRegs(value);
        }}
        onBlur={() => runValidationTasks("maxRegs", maxRegs)}
        errorMessage={errors.maxRegs?.errorMessage}
        hasError={errors.maxRegs?.hasError}
        {...getOverrideProps(overrides, "maxRegs")}
      ></TextField>
      <TextField
        label="Total de escaneos del ticket"
        descriptiveText="Cantidad máxima de escaneos permitidos por dispositivo para cada ticket individual."
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={totalScannedTicket}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket: value,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.totalScannedTicket ?? value;
          }
          if (errors.totalScannedTicket?.hasError) {
            runValidationTasks("totalScannedTicket", value);
          }
          setTotalScannedTicket(value);
        }}
        onBlur={() =>
          runValidationTasks("totalScannedTicket", totalScannedTicket)
        }
        errorMessage={errors.totalScannedTicket?.errorMessage}
        hasError={errors.totalScannedTicket?.hasError}
        {...getOverrideProps(overrides, "totalScannedTicket")}
      ></TextField>
      <TextAreaField
        label="Plantilla de email de contacto"
        isRequired={false}
        isReadOnly={false}
        value={contactTemplate}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate: value,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.contactTemplate ?? value;
          }
          if (errors.contactTemplate?.hasError) {
            runValidationTasks("contactTemplate", value);
          }
          setContactTemplate(value);
        }}
        onBlur={() => runValidationTasks("contactTemplate", contactTemplate)}
        errorMessage={errors.contactTemplate?.errorMessage}
        hasError={errors.contactTemplate?.hasError}
        {...getOverrideProps(overrides, "contactTemplate")}
      ></TextAreaField>
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge: value,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.Badge ?? value;
          }
          setBadge(value);
          setCurrentBadgeValue(undefined);
          setCurrentBadgeDisplayValue("");
        }}
        currentFieldValue={currentBadgeValue}
        label={"Asignar dise\u00F1o gafete"}
        items={Badge ? [Badge] : []}
        hasError={errors?.Badge?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("Badge", currentBadgeValue)
        }
        errorMessage={errors?.Badge?.errorMessage}
        getBadgeText={getDisplayValue.Badge}
        setFieldValue={(model) => {
          setCurrentBadgeDisplayValue(
            model ? getDisplayValue.Badge(model) : ""
          );
          setCurrentBadgeValue(model);
        }}
        inputFieldRef={BadgeRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Asignar diseño gafete"
          isRequired={false}
          isReadOnly={false}
          placeholder="Buscar gafete"
          value={currentBadgeDisplayValue}
          options={badgeRecords
            .filter((r) => !BadgeIdSet.has(getIDValue.Badge?.(r)))
            .map((r) => ({
              id: getIDValue.Badge?.(r),
              label: getDisplayValue.Badge?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentBadgeValue(
              badgeRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentBadgeDisplayValue(label);
            runValidationTasks("Badge", label);
          }}
          onClear={() => {
            setCurrentBadgeDisplayValue("");
          }}
          defaultValue={Badge}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.Badge?.hasError) {
              runValidationTasks("Badge", value);
            }
            setCurrentBadgeDisplayValue(value);
            setCurrentBadgeValue(undefined);
          }}
          onBlur={() => runValidationTasks("Badge", currentBadgeDisplayValue)}
          errorMessage={errors.Badge?.errorMessage}
          hasError={errors.Badge?.hasError}
          ref={BadgeRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "Badge")}
        ></Autocomplete>
      </ArrayField>
      <Heading
        level={5}
        children="Botón de pagos (Opcional)"
        {...getOverrideProps(overrides, "SectionalElement0")}
      ></Heading>
      <TextField
        label="Usuario USFQ"
        isRequired={false}
        isReadOnly={false}
        value={usuarioUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ: value,
              eventIdUSFQ,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.usuarioUSFQ ?? value;
          }
          if (errors.usuarioUSFQ?.hasError) {
            runValidationTasks("usuarioUSFQ", value);
          }
          setUsuarioUSFQ(value);
        }}
        onBlur={() => runValidationTasks("usuarioUSFQ", usuarioUSFQ)}
        errorMessage={errors.usuarioUSFQ?.errorMessage}
        hasError={errors.usuarioUSFQ?.hasError}
        {...getOverrideProps(overrides, "usuarioUSFQ")}
      ></TextField>
      <TextField
        label="ID Evento USFQ"
        isRequired={false}
        isReadOnly={false}
        value={eventIdUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ: value,
              periodoUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.eventIdUSFQ ?? value;
          }
          if (errors.eventIdUSFQ?.hasError) {
            runValidationTasks("eventIdUSFQ", value);
          }
          setEventIdUSFQ(value);
        }}
        onBlur={() => runValidationTasks("eventIdUSFQ", eventIdUSFQ)}
        errorMessage={errors.eventIdUSFQ?.errorMessage}
        hasError={errors.eventIdUSFQ?.hasError}
        {...getOverrideProps(overrides, "eventIdUSFQ")}
      ></TextField>
      <TextField
        label="Periodo USFQ"
        isRequired={false}
        isReadOnly={false}
        value={periodoUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              Badge,
              usuarioUSFQ,
              eventIdUSFQ,
              periodoUSFQ: value,
            };
            const result = onChange(modelFields);
            value = result?.periodoUSFQ ?? value;
          }
          if (errors.periodoUSFQ?.hasError) {
            runValidationTasks("periodoUSFQ", value);
          }
          setPeriodoUSFQ(value);
        }}
        onBlur={() => runValidationTasks("periodoUSFQ", periodoUSFQ)}
        errorMessage={errors.periodoUSFQ?.errorMessage}
        hasError={errors.periodoUSFQ?.hasError}
        {...getOverrideProps(overrides, "periodoUSFQ")}
      ></TextField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Cancelar"
            type="button"
            onClick={() => {
              onCancel && onCancel();
            }}
            {...getOverrideProps(overrides, "CancelButton")}
          ></Button>
          <Button
            children="Actualizar"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || eventModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
