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
import TestCertificate from "components/TestCertificate";
import CertificatePreview from "components/CertificatePreview";
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
      ? { ...initialValues, ...eventRecord, Badge }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setDate(cleanValues.date);
    setStartDate(cleanValues.startDate);
    setEndDate(cleanValues.endDate);
    setTimezone(cleanValues.timezone);
    setSendCertificates(cleanValues.sendCertificates);
    setCertificate(cleanValues.certificate);
    setCertificatePosition(cleanValues.certificatePosition);
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
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Event, idProp)
        : eventModelProp;
      setEventRecord(record);
      const BadgeRecord = record ? await record.Badge : undefined;
      setBadge(BadgeRecord);
    };
    queryData();
  }, [idProp, eventModelProp]);
  React.useEffect(resetStateValues, [eventRecord, Badge]);
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
      const v = JSON.parse(certificatePosition || "{}");
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
  // Auto-save just the certificate fields so uploading/adjusting persists
  // WITHOUT clicking Update (you can test right away).
  const persistCert = async (cert, posJson) => {
    if (!eventRecord) return;
    try {
      await DataStore.save(
        Event.copyOf(eventRecord, (u) => {
          u.certificate = cert;
          u.certificatePosition = posJson;
          u.sendCertificates = true;
        })
      );
    } catch (e) {
      console.error("auto-save certificate:", e);
    }
  };
  const updateCertSettings = (patch, { persist = true } = {}) => {
    const next = JSON.stringify({ ...certSettings, ...patch });
    setCertificatePosition(next);
    if (persist) persistCert(certificate, next);
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
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
          await DataStore.save(
            Event.copyOf(eventRecord, (updated) => {
              Object.assign(updated, modelFields);
              if (!modelFields.Badge) {
                updated.eventBadgeId = undefined;
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
                  setCertificate(key);
                  persistCert(key, certificatePosition);
                }}
                onFileRemove={() => {
                  setCertificate(initialValues?.certificate);
                  persistCert(initialValues?.certificate, certificatePosition);
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
                onMouseUp={() => persistCert(certificate, certificatePosition)}
                onTouchEnd={() => persistCert(certificate, certificatePosition)}
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
                onMouseUp={() => persistCert(certificate, certificatePosition)}
                onTouchEnd={() => persistCert(certificate, certificatePosition)}
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
                onBlur={() => persistCert(certificate, certificatePosition)}
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
              value={
                certSettings.sendAt
                  ? convertToLocal(new Date(certSettings.sendAt))
                  : ""
              }
              onChange={(e) =>
                updateCertSettings({
                  sendAt: e.target.value
                    ? new Date(e.target.value).toISOString()
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
            <Text fontSize="0.8125rem" color="#6b7280">
              Si lo dejas vacío, se envían automáticamente cuando termina el
              evento. Solo a quienes pidieron certificado en el formulario.
            </Text>
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
              persistCert(certificate, certificatePosition)
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
