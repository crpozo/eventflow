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
import { ImageFileList } from "components/storage/ImageFileList";
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
export default function LandingUpdateForm(props) {
  const {
    id: idProp,
    landing: landingModelProp,
    onSuccess,
    onError,
    onSubmit,
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
    extraInfo: "",
    userConsentCheck: "",
    ticketTitle: [],
    ticketPrice: [],
    galleryPhotos: [],
    partnerLogos: [],
    customHtml: "",
  };
  const [active, setActive] = React.useState(initialValues.active);
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [mainBanner, setMainBanner] = React.useState(initialValues.mainBanner);
  const [location, setLocation] = React.useState(initialValues.location);
  const [cost, setCost] = React.useState(initialValues.cost);
  const [extraInfo, setExtraInfo] = React.useState(initialValues.extraInfo);
  const [userConsentCheck, setUserConsentCheck] = React.useState(
    initialValues.userConsentCheck
  );
  const [ticketTitle, setTicketTitle] = React.useState(
    initialValues.ticketTitle
  );
  const [ticketPrice, setTicketPrice] = React.useState(
    initialValues.ticketPrice
  );
  const [galleryPhotos, setGalleryPhotos] = React.useState(
    initialValues.galleryPhotos
  );
  const [partnerLogos, setPartnerLogos] = React.useState(
    initialValues.partnerLogos
  );
  const [customHtml, setCustomHtml] = React.useState(initialValues.customHtml);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = landingRecord
      ? { ...initialValues, ...landingRecord }
      : initialValues;
    setActive(cleanValues.active);
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setMainBanner(cleanValues.mainBanner);
    setLocation(cleanValues.location);
    setCost(cleanValues.cost);
    setExtraInfo(cleanValues.extraInfo);
    setUserConsentCheck(cleanValues.userConsentCheck);
    setTicketTitle(cleanValues.ticketTitle ?? []);
    setCurrentTicketTitleValue("");
    setTicketPrice(cleanValues.ticketPrice ?? []);
    setCurrentTicketPriceValue("");
    setGalleryPhotos(cleanValues.galleryPhotos ?? []);
    setPartnerLogos(cleanValues.partnerLogos ?? []);
    setCustomHtml(cleanValues.customHtml);
    setErrors({});
  };
  const [landingRecord, setLandingRecord] = React.useState(landingModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Landing, idProp)
        : landingModelProp;
      setLandingRecord(record);
    };
    queryData();
  }, [idProp, landingModelProp]);
  React.useEffect(resetStateValues, [landingRecord]);
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
    extraInfo: [],
    userConsentCheck: [],
    ticketTitle: [],
    ticketPrice: [],
    galleryPhotos: [],
    partnerLogos: [],
    customHtml: [],
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
  // Persist gallery / logos / customHtml immediately (re-querying the freshest
  // record to avoid version conflicts), so uploads are saved without having to
  // submit the whole form. Matches the previous media-manager behavior.
  const customHtmlTimer = React.useRef();
  const persistMedia = async (field, nextValue) => {
    if (!landingRecord?.id) return;
    // De-dupe array values (gallery/logos) so duplicate keys never accumulate.
    const value = Array.isArray(nextValue)
      ? [...new Set(nextValue.filter(Boolean))]
      : nextValue;
    try {
      const fresh = await DataStore.query(Landing, landingRecord.id);
      if (!fresh) return;
      const saved = await DataStore.save(
        Landing.copyOf(fresh, (u) => {
          u[field] = value;
        })
      );
      setLandingRecord(saved);
    } catch (e) {
      console.error("No se pudo guardar el contenido extra:", e);
    }
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
          extraInfo,
          userConsentCheck,
          ticketTitle,
          ticketPrice,
          galleryPhotos,
          partnerLogos,
          customHtml,
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
            Landing.copyOf(landingRecord, (updated) => {
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
      {...getOverrideProps(overrides, "LandingUpdateForm")}
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
      <Heading
        level={5}
        children="Diseño visual de la página"
        {...getOverrideProps(overrides, "SectionalElement1")}
      ></Heading>
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
        value={description}
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
        label={"Imagen banner principal"}
        isRequired={false}
        isReadOnly={false}
      >
        {landingRecord && (
          <StorageManager
            defaultFiles={[{ key: landingRecord.mainBanner }]}
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
                    extraInfo,
                    userConsentCheck,
                    ticketTitle,
                    ticketPrice,
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
                    extraInfo,
                    userConsentCheck,
                    ticketTitle,
                    ticketPrice,
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
            components={{ FileList: ImageFileList }}
            {...getOverrideProps(overrides, "mainBanner")}
          ></StorageManager>
        )}
      </Field>
      <Field
        errorMessage={errors.galleryPhotos?.errorMessage}
        hasError={errors.galleryPhotos?.hasError}
        label={"Galería de fotos"}
        descriptiveText="Fotos que se muestran en la landing, debajo de los detalles del evento."
        isRequired={false}
        isReadOnly={false}
      >
        {landingRecord && (
          <StorageManager
            defaultFiles={[
              ...new Set((landingRecord.galleryPhotos || []).filter(Boolean)),
            ].map((key) => ({ key }))}
            onUploadSuccess={({ key }) => {
              setGalleryPhotos((prev) => {
                const next = [...new Set([...(prev || []), key])];
                persistMedia("galleryPhotos", next);
                return next;
              });
            }}
            onFileRemove={({ key }) => {
              setGalleryPhotos((prev) => {
                const next = (prev || []).filter((k) => k !== key);
                persistMedia("galleryPhotos", next);
                return next;
              });
            }}
            processFile={processFile}
            accessLevel={"public"}
            acceptedFileTypes={["image/*"]}
            isResumable={false}
            showThumbnails={true}
            maxFileCount={30}
            components={{ FileList: ImageFileList }}
            {...getOverrideProps(overrides, "galleryPhotos")}
          ></StorageManager>
        )}
      </Field>
      <Field
        errorMessage={errors.partnerLogos?.errorMessage}
        hasError={errors.partnerLogos?.hasError}
        label={"Logos de aliados (carrusel)"}
        descriptiveText="Logos que se muestran en un carrusel en la landing."
        isRequired={false}
        isReadOnly={false}
      >
        {landingRecord && (
          <StorageManager
            defaultFiles={[
              ...new Set((landingRecord.partnerLogos || []).filter(Boolean)),
            ].map((key) => ({ key }))}
            onUploadSuccess={({ key }) => {
              setPartnerLogos((prev) => {
                const next = [...new Set([...(prev || []), key])];
                persistMedia("partnerLogos", next);
                return next;
              });
            }}
            onFileRemove={({ key }) => {
              setPartnerLogos((prev) => {
                const next = (prev || []).filter((k) => k !== key);
                persistMedia("partnerLogos", next);
                return next;
              });
            }}
            processFile={processFile}
            accessLevel={"public"}
            acceptedFileTypes={["image/*"]}
            isResumable={false}
            showThumbnails={true}
            maxFileCount={30}
            components={{ FileList: ImageFileList }}
            {...getOverrideProps(overrides, "partnerLogos")}
          ></StorageManager>
        )}
      </Field>
      <TextAreaField
        label="Bloque HTML personalizado"
        descriptiveText="Se renderiza tal cual en la landing. Ej: un botón para descargar un PDF. Usa solo HTML de confianza."
        placeholder={'<a href="https://..." class="...">Descargar PDF</a>'}
        isRequired={false}
        isReadOnly={false}
        value={customHtml}
        onChange={(e) => {
          let { value } = e.target;
          if (errors.customHtml?.hasError) {
            runValidationTasks("customHtml", value);
          }
          setCustomHtml(value);
          // Auto-save shortly after the admin stops typing (no need to blur).
          clearTimeout(customHtmlTimer.current);
          customHtmlTimer.current = setTimeout(() => {
            persistMedia("customHtml", value === "" ? null : value);
          }, 700);
        }}
        onBlur={() => {
          runValidationTasks("customHtml", customHtml);
          clearTimeout(customHtmlTimer.current);
          persistMedia("customHtml", customHtml === "" ? null : customHtml);
        }}
        errorMessage={errors.customHtml?.errorMessage}
        hasError={errors.customHtml?.hasError}
        {...getOverrideProps(overrides, "customHtml")}
      ></TextAreaField>
      <TextField
        label={
          <span style={{ display: "inline-flex" }}>
            <span>Ubicación del evento</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        isRequired={true}
        isReadOnly={false}
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
        label="Tarifa del evento"
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
      <TextAreaField
        label="Información adicional"
        isRequired={false}
        isReadOnly={false}
        value={extraInfo}
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
              extraInfo: value,
              userConsentCheck,
              ticketTitle,
              ticketPrice,
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
      <TextAreaField
        label="Checkbox de consentimiento del usuario"
        isRequired={false}
        isReadOnly={false}
        value={userConsentCheck}
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
              extraInfo,
              userConsentCheck: value,
              ticketTitle,
              ticketPrice,
            };
            const result = onChange(modelFields);
            value = result?.userConsentCheck ?? value;
          }
          if (errors.userConsentCheck?.hasError) {
            runValidationTasks("userConsentCheck", value);
          }
          setUserConsentCheck(value);
        }}
        onBlur={() => runValidationTasks("userConsentCheck", userConsentCheck)}
        errorMessage={errors.userConsentCheck?.errorMessage}
        hasError={errors.userConsentCheck?.hasError}
        {...getOverrideProps(overrides, "userConsentCheck")}
      ></TextAreaField>
      <Heading
        level={5}
        children="Creación de tickets"
        {...getOverrideProps(overrides, "SectionalElement3")}
      ></Heading>
      <Text
        children="Crear un ticket asignándole una etiqueta (label) y su respectivo precio. Por ejemplo: 'Entrada General' con precio de $10 (no se requiere agregar el simbolo $)"
        {...getOverrideProps(overrides, "SectionalElement4")}
      ></Text>
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
              extraInfo,
              userConsentCheck,
              ticketTitle: values,
              ticketPrice,
            };
            const result = onChange(modelFields);
            values = result?.ticketTitle ?? values;
          }
          setTicketTitle(values);
          setCurrentTicketTitleValue("");
        }}
        currentFieldValue={currentTicketTitleValue}
        label={"Label tickets"}
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
          label="Label tickets"
          isRequired={false}
          isReadOnly={false}
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
              extraInfo,
              userConsentCheck,
              ticketTitle,
              ticketPrice: values,
            };
            const result = onChange(modelFields);
            values = result?.ticketPrice ?? values;
          }
          setTicketPrice(values);
          setCurrentTicketPriceValue("");
        }}
        currentFieldValue={currentTicketPriceValue}
        label={"Precio tickets"}
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
          label="Precio tickets"
          isRequired={false}
          isReadOnly={false}
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
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Guardar"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || landingModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
