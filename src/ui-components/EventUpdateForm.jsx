/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Event } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify";
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
    category: "",
    location: "",
    date: "",
    contactName: [],
    contactNumber: [],
    termsCondition: "",
    eventIdUSFQ: "",
    periodoUSFQ: "",
    usuarioUSFQ: "",
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [category, setCategory] = React.useState(initialValues.category);
  const [location, setLocation] = React.useState(initialValues.location);
  const [date, setDate] = React.useState(initialValues.date);
  const [contactName, setContactName] = React.useState(
    initialValues.contactName
  );
  const [contactNumber, setContactNumber] = React.useState(
    initialValues.contactNumber
  );
  const [termsCondition, setTermsCondition] = React.useState(
    initialValues.termsCondition
  );
  const [eventIdUSFQ, setEventIdUSFQ] = React.useState(
    initialValues.eventIdUSFQ
  );
  const [periodoUSFQ, setPeriodoUSFQ] = React.useState(
    initialValues.periodoUSFQ
  );
  const [usuarioUSFQ, setUsuarioUSFQ] = React.useState(
    initialValues.usuarioUSFQ
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = eventRecord
      ? { ...initialValues, ...eventRecord }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setCategory(cleanValues.category);
    setLocation(cleanValues.location);
    setDate(cleanValues.date);
    setContactName(cleanValues.contactName ?? []);
    setCurrentContactNameValue("");
    setContactNumber(cleanValues.contactNumber ?? []);
    setCurrentContactNumberValue("");
    setTermsCondition(cleanValues.termsCondition);
    setEventIdUSFQ(cleanValues.eventIdUSFQ);
    setPeriodoUSFQ(cleanValues.periodoUSFQ);
    setUsuarioUSFQ(cleanValues.usuarioUSFQ);
    setErrors({});
  };
  const [eventRecord, setEventRecord] = React.useState(eventModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Event, idProp)
        : eventModelProp;
      setEventRecord(record);
    };
    queryData();
  }, [idProp, eventModelProp]);
  React.useEffect(resetStateValues, [eventRecord]);
  const [currentContactNameValue, setCurrentContactNameValue] =
    React.useState("");
  const contactNameRef = React.createRef();
  const [currentContactNumberValue, setCurrentContactNumberValue] =
    React.useState("");
  const contactNumberRef = React.createRef();
  const validations = {
    title: [],
    description: [],
    category: [],
    location: [],
    date: [],
    contactName: [],
    contactNumber: [],
    termsCondition: [],
    eventIdUSFQ: [],
    periodoUSFQ: [],
    usuarioUSFQ: [],
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
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
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
          category,
          location,
          date,
          contactName,
          contactNumber,
          termsCondition,
          eventIdUSFQ,
          periodoUSFQ,
          usuarioUSFQ,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
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
        label="Indica a los usuarios como se llama el evento"
        isRequired={false}
        isReadOnly={false}
        placeholder="Nombre evento"
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
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
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
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
        label="Tipo/Categoría"
        isRequired={false}
        isReadOnly={false}
        placeholder="Conferencia"
        value={category}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category: value,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.category ?? value;
          }
          if (errors.category?.hasError) {
            runValidationTasks("category", value);
          }
          setCategory(value);
        }}
        onBlur={() => runValidationTasks("category", category)}
        errorMessage={errors.category?.errorMessage}
        hasError={errors.category?.hasError}
        {...getOverrideProps(overrides, "category")}
      ></TextField>
      <TextField
        label="Lugar donde se celebrará el evento"
        isRequired={false}
        isReadOnly={false}
        placeholder="Universidad (in-house)"
        value={location}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location: value,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
            };
            const result = onChange(modelFields);
            value = result?.location ?? value;
          }
          if (errors.location?.hasError) {
            runValidationTasks("location", value);
          }
          setLocation(value);
        }}
        onBlur={() => runValidationTasks("location", location)}
        errorMessage={errors.location?.errorMessage}
        hasError={errors.location?.hasError}
        {...getOverrideProps(overrides, "location")}
      ></TextField>
      <TextField
        label="Fecha y hora"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={date && convertToLocal(new Date(date))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date: value,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
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
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName: values,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
            };
            const result = onChange(modelFields);
            values = result?.contactName ?? values;
          }
          setContactName(values);
          setCurrentContactNameValue("");
        }}
        currentFieldValue={currentContactNameValue}
        label={"Nombre contacto"}
        items={contactName}
        hasError={errors?.contactName?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("contactName", currentContactNameValue)
        }
        errorMessage={errors?.contactName?.errorMessage}
        setFieldValue={setCurrentContactNameValue}
        inputFieldRef={contactNameRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Nombre contacto"
          isRequired={false}
          isReadOnly={false}
          value={currentContactNameValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.contactName?.hasError) {
              runValidationTasks("contactName", value);
            }
            setCurrentContactNameValue(value);
          }}
          onBlur={() =>
            runValidationTasks("contactName", currentContactNameValue)
          }
          errorMessage={errors.contactName?.errorMessage}
          hasError={errors.contactName?.hasError}
          ref={contactNameRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "contactName")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber: values,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
            };
            const result = onChange(modelFields);
            values = result?.contactNumber ?? values;
          }
          setContactNumber(values);
          setCurrentContactNumberValue("");
        }}
        currentFieldValue={currentContactNumberValue}
        label={"N\u00FAmero contacto"}
        items={contactNumber}
        hasError={errors?.contactNumber?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("contactNumber", currentContactNumberValue)
        }
        errorMessage={errors?.contactNumber?.errorMessage}
        setFieldValue={setCurrentContactNumberValue}
        inputFieldRef={contactNumberRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Número contacto"
          isRequired={false}
          isReadOnly={false}
          type="number"
          step="any"
          value={currentContactNumberValue}
          onChange={(e) => {
            let value = isNaN(parseFloat(e.target.value))
              ? e.target.value
              : parseFloat(e.target.value);
            if (errors.contactNumber?.hasError) {
              runValidationTasks("contactNumber", value);
            }
            setCurrentContactNumberValue(value);
          }}
          onBlur={() =>
            runValidationTasks("contactNumber", currentContactNumberValue)
          }
          errorMessage={errors.contactNumber?.errorMessage}
          hasError={errors.contactNumber?.hasError}
          ref={contactNumberRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "contactNumber")}
        ></TextField>
      </ArrayField>
      <TextField
        label="Términos y condiciones"
        isRequired={false}
        isReadOnly={false}
        placeholder="La siguiente información se visualizará dentro de la aplicación para los usuarios finales"
        value={termsCondition}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition: value,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ,
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
        label="Event id usfq"
        isRequired={false}
        isReadOnly={false}
        value={eventIdUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ: value,
              periodoUSFQ,
              usuarioUSFQ,
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
        label="Periodo usfq"
        isRequired={false}
        isReadOnly={false}
        value={periodoUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ: value,
              usuarioUSFQ,
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
        label="Usuario usfq"
        isRequired={false}
        isReadOnly={false}
        value={usuarioUSFQ}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              category,
              location,
              date,
              contactName,
              contactNumber,
              termsCondition,
              eventIdUSFQ,
              periodoUSFQ,
              usuarioUSFQ: value,
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
