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
  SelectField,
  SwitchField,
  Text,
  TextAreaField,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { StorageManager } from "@aws-amplify/ui-react-storage";
import { Landing } from "../models";
import {
  fetchByPath,
  getOverrideProps,
  processFile,
  validateField,
} from "./utils";
import { Field } from "@aws-amplify/ui-react/internal";
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
export default function LandingCreateForm(props) {
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
    active: false,
    title: "",
    description: "",
    mainBanner: undefined,
    location: "",
    cost: "",
    ticketTitle: [],
    ticketPrice: [],
    extraInfo: "",
  };
  const [active, setActive] = React.useState(initialValues.active);
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [mainBanner, setMainBanner] = React.useState(initialValues.mainBanner);
  const [location, setLocation] = React.useState(initialValues.location);
  const [cost, setCost] = React.useState(initialValues.cost);
  const [ticketTitle, setTicketTitle] = React.useState(
    initialValues.ticketTitle
  );
  const [ticketPrice, setTicketPrice] = React.useState(
    initialValues.ticketPrice
  );
  const [extraInfo, setExtraInfo] = React.useState(initialValues.extraInfo);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setActive(initialValues.active);
    setTitle(initialValues.title);
    setDescription(initialValues.description);
    setMainBanner(initialValues.mainBanner);
    setLocation(initialValues.location);
    setCost(initialValues.cost);
    setTicketTitle(initialValues.ticketTitle);
    setCurrentTicketTitleValue("");
    setTicketPrice(initialValues.ticketPrice);
    setCurrentTicketPriceValue("");
    setExtraInfo(initialValues.extraInfo);
    setErrors({});
  };
  const [currentTicketTitleValue, setCurrentTicketTitleValue] =
    React.useState("");
  const ticketTitleRef = React.createRef();
  const [currentTicketPriceValue, setCurrentTicketPriceValue] =
    React.useState("");
  const ticketPriceRef = React.createRef();
  const validations = {
    active: [],
    title: [{ type: "Required" }],
    description: [{ type: "Required" }],
    mainBanner: [],
    location: [{ type: "Required" }],
    cost: [],
    ticketTitle: [],
    ticketPrice: [],
    extraInfo: [],
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
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          active,
          title,
          description,
          mainBanner,
          location,
          cost,
          ticketTitle,
          ticketPrice,
          extraInfo,
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
          await DataStore.save(new Landing(modelFields));
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
      {...getOverrideProps(overrides, "LandingCreateForm")}
      {...rest}
    >
      <SwitchField
        label="Publicar landing"
        defaultChecked={false}
        isDisabled={false}
        isChecked={active}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              active: value,
              title,
              description,
              mainBanner,
              location,
              cost,
              ticketTitle,
              ticketPrice,
              extraInfo,
            };
            const result = onChange(modelFields);
            value = result?.active ?? value;
          }
          if (errors.active?.hasError) {
            runValidationTasks("active", value);
          }
          setActive(value);
        }}
        onBlur={() => runValidationTasks("active", active)}
        errorMessage={errors.active?.errorMessage}
        hasError={errors.active?.hasError}
        {...getOverrideProps(overrides, "active")}
      ></SwitchField>
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Titulo principal</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              active,
              title: value,
              description,
              mainBanner,
              location,
              cost,
              ticketTitle,
              ticketPrice,
              extraInfo,
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
        label={
          <span style={{ display: "inline-flex" }}>
            <span>
              Descripción corta que se mostrará en el banner principal
            </span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        placeholder="De que se trata el evento?"
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description: value,
              mainBanner,
              location,
              cost,
              ticketTitle,
              ticketPrice,
              extraInfo,
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
      <Field
        errorMessage={errors.mainBanner?.errorMessage}
        hasError={errors.mainBanner?.hasError}
        label={"Imagen principal"}
        isRequired={false}
        isReadOnly={false}
      >
        <StorageManager
          onUploadSuccess={({ key }) => {
            setMainBanner((prev) => {
              let value = key;
              if (onChange) {
                const modelFields = {
                  active,
                  title,
                  description,
                  mainBanner: value,
                  location,
                  cost,
                  ticketTitle,
                  ticketPrice,
                  extraInfo,
                };
                const result = onChange(modelFields);
                value = result?.mainBanner ?? value;
              }
              return value;
            });
          }}
          onFileRemove={({ key }) => {
            setMainBanner((prev) => {
              let value = initialValues?.mainBanner;
              if (onChange) {
                const modelFields = {
                  active,
                  title,
                  description,
                  mainBanner: value,
                  location,
                  cost,
                  ticketTitle,
                  ticketPrice,
                  extraInfo,
                };
                const result = onChange(modelFields);
                value = result?.mainBanner ?? value;
              }
              return value;
            });
          }}
          processFile={processFile}
          accessLevel={"public"}
          acceptedFileTypes={["image/*"]}
          isResumable={false}
          showThumbnails={true}
          maxFileCount={1}
          {...getOverrideProps(overrides, "mainBanner")}
        ></StorageManager>
      </Field>
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Ubicación del evento</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
        placeholder="Campus Cumbayá, Diego de Robles s/n, Quito 170901, Ecuador"
        value={location}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description,
              mainBanner,
              location: value,
              cost,
              ticketTitle,
              ticketPrice,
              extraInfo,
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
      <SelectField
        label="Accesso al evento"
        placeholder="Seleccione una opción"
        isDisabled={false}
        value={cost}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description,
              mainBanner,
              location,
              cost: value,
              ticketTitle,
              ticketPrice,
              extraInfo,
            };
            const result = onChange(modelFields);
            value = result?.cost ?? value;
          }
          if (errors.cost?.hasError) {
            runValidationTasks("cost", value);
          }
          setCost(value);
        }}
        onBlur={() => runValidationTasks("cost", cost)}
        errorMessage={errors.cost?.errorMessage}
        hasError={errors.cost?.hasError}
        {...getOverrideProps(overrides, "cost")}
      >
        <option
          children="Pago"
          value="Pago"
          {...getOverrideProps(overrides, "costoption0")}
        ></option>
        <option
          children="Gratuito"
          value="Gratuito"
          {...getOverrideProps(overrides, "costoption1")}
        ></option>
      </SelectField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description,
              mainBanner,
              location,
              cost,
              ticketTitle: values,
              ticketPrice,
              extraInfo,
            };
            const result = onChange(modelFields);
            values = result?.ticketTitle ?? values;
          }
          setTicketTitle(values);
          setCurrentTicketTitleValue("");
        }}
        currentFieldValue={currentTicketTitleValue}
        label={"Creaci\u00F3n tickets"}
        items={ticketTitle}
        hasError={errors?.ticketTitle?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("ticketTitle", currentTicketTitleValue)
        }
        errorMessage={errors?.ticketTitle?.errorMessage}
        setFieldValue={setCurrentTicketTitleValue}
        inputFieldRef={ticketTitleRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Creación tickets"
          isRequired={false}
          isReadOnly={false}
          placeholder="Añadir nuevo ticket"
          value={currentTicketTitleValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.ticketTitle?.hasError) {
              runValidationTasks("ticketTitle", value);
            }
            setCurrentTicketTitleValue(value);
          }}
          onBlur={() =>
            runValidationTasks("ticketTitle", currentTicketTitleValue)
          }
          errorMessage={errors.ticketTitle?.errorMessage}
          hasError={errors.ticketTitle?.hasError}
          ref={ticketTitleRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "ticketTitle")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description,
              mainBanner,
              location,
              cost,
              ticketTitle,
              ticketPrice: values,
              extraInfo,
            };
            const result = onChange(modelFields);
            values = result?.ticketPrice ?? values;
          }
          setTicketPrice(values);
          setCurrentTicketPriceValue("");
        }}
        currentFieldValue={currentTicketPriceValue}
        label={"Creaci\u00F3n precios"}
        items={ticketPrice}
        hasError={errors?.ticketPrice?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("ticketPrice", currentTicketPriceValue)
        }
        errorMessage={errors?.ticketPrice?.errorMessage}
        setFieldValue={setCurrentTicketPriceValue}
        inputFieldRef={ticketPriceRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Creación precios"
          isRequired={false}
          isReadOnly={false}
          placeholder="Añadir nuevo precio"
          type="number"
          step="any"
          value={currentTicketPriceValue}
          onChange={(e) => {
            let value = isNaN(parseFloat(e.target.value))
              ? e.target.value
              : parseFloat(e.target.value);
            if (errors.ticketPrice?.hasError) {
              runValidationTasks("ticketPrice", value);
            }
            setCurrentTicketPriceValue(value);
          }}
          onBlur={() =>
            runValidationTasks("ticketPrice", currentTicketPriceValue)
          }
          errorMessage={errors.ticketPrice?.errorMessage}
          hasError={errors.ticketPrice?.hasError}
          ref={ticketPriceRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "ticketPrice")}
        ></TextField>
      </ArrayField>
      <TextAreaField
        label="Información adicional"
        isRequired={false}
        isReadOnly={false}
        placeholder="Ejemplo: política de reembolso"
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              active,
              title,
              description,
              mainBanner,
              location,
              cost,
              ticketTitle,
              ticketPrice,
              extraInfo: value,
            };
            const result = onChange(modelFields);
            value = result?.extraInfo ?? value;
          }
          if (errors.extraInfo?.hasError) {
            runValidationTasks("extraInfo", value);
          }
          setExtraInfo(value);
        }}
        onBlur={() => runValidationTasks("extraInfo", extraInfo)}
        errorMessage={errors.extraInfo?.errorMessage}
        hasError={errors.extraInfo?.hasError}
        {...getOverrideProps(overrides, "extraInfo")}
      ></TextAreaField>
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
