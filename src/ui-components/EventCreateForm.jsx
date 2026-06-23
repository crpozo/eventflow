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
  SwitchField,
  Text,
  TextAreaField,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Event, Badge as Badge0, Career } from "../models";
import {
  fetchByPath,
  getOverrideProps,
  useDataStoreBinding,
  validateField,
} from "./utils";
import { DataStore } from "aws-amplify/datastore";
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
export default function EventCreateForm(props) {
  const {
    clearOnSuccess = true,
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
    termsCondition: "",
    maxRegs: "",
    totalScannedTicket: "",
    contactTemplate: "",
    startDate: "",
    endDate: "",
    sendCertificates: false,
    certificate: "",
    certificatePosition: "",
    certificatesSentAt: "",
    careerID: undefined,
    Badge: undefined,
    usuarioUSFQ: "",
    periodoUSFQ: "",
    eventIdUSFQ: "",
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [date, setDate] = React.useState(initialValues.date);
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
  const [startDate, setStartDate] = React.useState(initialValues.startDate);
  const [endDate, setEndDate] = React.useState(initialValues.endDate);
  const [sendCertificates, setSendCertificates] = React.useState(
    initialValues.sendCertificates
  );
  const [certificate, setCertificate] = React.useState(
    initialValues.certificate
  );
  const [certificatePosition, setCertificatePosition] = React.useState(
    initialValues.certificatePosition
  );
  const [certificatesSentAt, setCertificatesSentAt] = React.useState(
    initialValues.certificatesSentAt
  );
  const [careerID, setCareerID] = React.useState(initialValues.careerID);
  const [Badge, setBadge] = React.useState(initialValues.Badge);
  const [usuarioUSFQ, setUsuarioUSFQ] = React.useState(
    initialValues.usuarioUSFQ
  );
  const [periodoUSFQ, setPeriodoUSFQ] = React.useState(
    initialValues.periodoUSFQ
  );
  const [eventIdUSFQ, setEventIdUSFQ] = React.useState(
    initialValues.eventIdUSFQ
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setDate(initialValues.date);
    setTermsCondition(initialValues.termsCondition);
    setMaxRegs(initialValues.maxRegs);
    setTotalScannedTicket(initialValues.totalScannedTicket);
    setContactTemplate(initialValues.contactTemplate);
    setStartDate(initialValues.startDate);
    setEndDate(initialValues.endDate);
    setSendCertificates(initialValues.sendCertificates);
    setCertificate(initialValues.certificate);
    setCertificatePosition(initialValues.certificatePosition);
    setCertificatesSentAt(initialValues.certificatesSentAt);
    setCareerID(initialValues.careerID);
    setCurrentCareerIDValue(undefined);
    setCurrentCareerIDDisplayValue("");
    setBadge(initialValues.Badge);
    setCurrentBadgeValue(undefined);
    setCurrentBadgeDisplayValue("");
    setUsuarioUSFQ(initialValues.usuarioUSFQ);
    setPeriodoUSFQ(initialValues.periodoUSFQ);
    setEventIdUSFQ(initialValues.eventIdUSFQ);
    setErrors({});
  };
  const [currentCareerIDDisplayValue, setCurrentCareerIDDisplayValue] =
    React.useState("");
  const [currentCareerIDValue, setCurrentCareerIDValue] =
    React.useState(undefined);
  const careerIDRef = React.createRef();
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
  const careerRecords = useDataStoreBinding({
    type: "collection",
    model: Career,
  }).items;
  const badgeRecords = useDataStoreBinding({
    type: "collection",
    model: Badge0,
  }).items;
  const getDisplayValue = {
    careerID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    Badge: (r) => `${r?.frontDesign ? r?.frontDesign + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [{ type: "Required" }],
    description: [],
    date: [],
    termsCondition: [{ type: "Required" }],
    maxRegs: [],
    totalScannedTicket: [],
    contactTemplate: [],
    startDate: [],
    endDate: [],
    sendCertificates: [],
    certificate: [],
    certificatePosition: [{ type: "JSON" }],
    certificatesSentAt: [],
    careerID: [{ type: "Required" }],
    Badge: [],
    usuarioUSFQ: [],
    periodoUSFQ: [],
    eventIdUSFQ: [],
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
      timeZone: "America/Guayaquil",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  // datetime-local value (Ecuador wall-clock "YYYY-MM-DDTHH:mm") -> UTC ISO,
  // pinned to Ecuador (UTC-5) regardless of the editor's timezone.
  const ecuadorLocalToISO = (v) =>
    v ? new Date(`${String(v).slice(0, 16)}:00-05:00`).toISOString() : "";
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
          termsCondition,
          maxRegs,
          totalScannedTicket,
          contactTemplate,
          startDate,
          endDate,
          sendCertificates,
          certificate,
          certificatePosition,
          certificatesSentAt,
          careerID,
          Badge,
          usuarioUSFQ,
          periodoUSFQ,
          eventIdUSFQ,
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
          await DataStore.save(new Event(modelFields));
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            onError(modelFields, err.message);
          }
        }
      }}
      {...getOverrideProps(overrides, "EventCreateForm")}
      {...rest}
    >
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Indica a los participantes como se llama el evento</span>
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
      <TextAreaField
        label="Descripción del evento"
        isRequired={false}
        isReadOnly={false}
        placeholder="De que se trata el evento?"
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
      ></TextAreaField>
      <TextField
        label="Fecha y hora"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={date && convertToLocal(new Date(date))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : ecuadorLocalToISO(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date: value,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.date ?? value;
          }
          if (errors.date?.hasError) {
            runValidationTasks("date", value);
          }
          setDate(value);
        }}
        onBlur={() => runValidationTasks("date", date)}
        errorMessage={errors.date?.errorMessage}
        hasError={errors.date?.hasError}
        {...getOverrideProps(overrides, "date")}
      ></TextField>
      <TextAreaField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Términos y condiciones (app móvil)</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        placeholder="La siguiente información se visualizará dentro de la aplicación para los usuarios finales"
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
      ></TextAreaField>
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
        label="Template email contacto"
        isRequired={false}
        isReadOnly={false}
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
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
      <TextField
        label="Start date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={startDate && convertToLocal(new Date(startDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : ecuadorLocalToISO(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              startDate: value,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.startDate ?? value;
          }
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
        label="End date"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={endDate && convertToLocal(new Date(endDate))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : ecuadorLocalToISO(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              startDate,
              endDate: value,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.endDate ?? value;
          }
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
      <SwitchField
        label="Send certificates"
        defaultChecked={false}
        isDisabled={false}
        isChecked={sendCertificates}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              startDate,
              endDate,
              sendCertificates: value,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.sendCertificates ?? value;
          }
          if (errors.sendCertificates?.hasError) {
            runValidationTasks("sendCertificates", value);
          }
          setSendCertificates(value);
        }}
        onBlur={() => runValidationTasks("sendCertificates", sendCertificates)}
        errorMessage={errors.sendCertificates?.errorMessage}
        hasError={errors.sendCertificates?.hasError}
        {...getOverrideProps(overrides, "sendCertificates")}
      ></SwitchField>
      <TextField
        label="Certificate"
        isRequired={false}
        isReadOnly={false}
        value={certificate}
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
              startDate,
              endDate,
              sendCertificates,
              certificate: value,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.certificate ?? value;
          }
          if (errors.certificate?.hasError) {
            runValidationTasks("certificate", value);
          }
          setCertificate(value);
        }}
        onBlur={() => runValidationTasks("certificate", certificate)}
        errorMessage={errors.certificate?.errorMessage}
        hasError={errors.certificate?.hasError}
        {...getOverrideProps(overrides, "certificate")}
      ></TextField>
      <TextAreaField
        label="Certificate position"
        isRequired={false}
        isReadOnly={false}
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition: value,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.certificatePosition ?? value;
          }
          if (errors.certificatePosition?.hasError) {
            runValidationTasks("certificatePosition", value);
          }
          setCertificatePosition(value);
        }}
        onBlur={() =>
          runValidationTasks("certificatePosition", certificatePosition)
        }
        errorMessage={errors.certificatePosition?.errorMessage}
        hasError={errors.certificatePosition?.hasError}
        {...getOverrideProps(overrides, "certificatePosition")}
      ></TextAreaField>
      <TextField
        label="Certificates sent at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={
          certificatesSentAt && convertToLocal(new Date(certificatesSentAt))
        }
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : ecuadorLocalToISO(e.target.value);
          if (onChange) {
            const modelFields = {
              title,
              description,
              date,
              termsCondition,
              maxRegs,
              totalScannedTicket,
              contactTemplate,
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt: value,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.certificatesSentAt ?? value;
          }
          if (errors.certificatesSentAt?.hasError) {
            runValidationTasks("certificatesSentAt", value);
          }
          setCertificatesSentAt(value);
        }}
        onBlur={() =>
          runValidationTasks("certificatesSentAt", certificatesSentAt)
        }
        errorMessage={errors.certificatesSentAt?.errorMessage}
        hasError={errors.certificatesSentAt?.hasError}
        {...getOverrideProps(overrides, "certificatesSentAt")}
      ></TextField>
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID: value,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.careerID ?? value;
          }
          setCareerID(value);
          setCurrentCareerIDValue(undefined);
        }}
        currentFieldValue={currentCareerIDValue}
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Asignar subárea</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        items={careerID ? [careerID] : []}
        hasError={errors?.careerID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("careerID", currentCareerIDValue)
        }
        errorMessage={errors?.careerID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.careerID(
                careerRecords.find((r) => r.id === value)
              )
            : ""
        }
        setFieldValue={(value) => {
          setCurrentCareerIDDisplayValue(
            value
              ? getDisplayValue.careerID(
                  careerRecords.find((r) => r.id === value)
                )
              : ""
          );
          setCurrentCareerIDValue(value);
        }}
        inputFieldRef={careerIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label={
            <span style={{ display: "inline-flex" }}>
              <span>Asignar subárea</span>
              <span style={{ color: "red" }}>*</span>
            </span>
          }
          isRequired={true}
          isReadOnly={false}
          placeholder="Buscar subárea"
          value={currentCareerIDDisplayValue}
          options={careerRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.careerID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentCareerIDValue(id);
            setCurrentCareerIDDisplayValue(label);
            runValidationTasks("careerID", label);
          }}
          onClear={() => {
            setCurrentCareerIDDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.careerID?.hasError) {
              runValidationTasks("careerID", value);
            }
            setCurrentCareerIDDisplayValue(value);
            setCurrentCareerIDValue(undefined);
          }}
          onBlur={() => runValidationTasks("careerID", currentCareerIDValue)}
          errorMessage={errors.careerID?.errorMessage}
          hasError={errors.careerID?.hasError}
          ref={careerIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "careerID")}
        ></Autocomplete>
      </ArrayField>
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge: value,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.Badge ?? value;
          }
          setBadge(value);
          setCurrentBadgeValue(undefined);
          setCurrentBadgeDisplayValue("");
        }}
        currentFieldValue={currentBadgeValue}
        label={"Asignar dise\u00F1o gafete (opcional)"}
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
          label="Asignar diseño gafete (opcional)"
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ: value,
              periodoUSFQ,
              eventIdUSFQ,
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ: value,
              eventIdUSFQ,
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
              startDate,
              endDate,
              sendCertificates,
              certificate,
              certificatePosition,
              certificatesSentAt,
              careerID,
              Badge,
              usuarioUSFQ,
              periodoUSFQ,
              eventIdUSFQ: value,
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
            children="Guardar"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
