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
  Icon,
  ScrollView,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import {
  getOverrideProps,
  useDataStoreBinding,
} from "@aws-amplify/ui-react/internal";
import {
  Event,
  Landing as Landing0,
  Form as Form0,
  EventAttende,
  Career,
} from "../models";
import { fetchByPath, validateField } from "./utils";
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
          <Button
            size="small"
            variation="link"
            isDisabled={hasError}
            onClick={addItem}
          >
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
    Landing: undefined,
    careerID: undefined,
    Form: undefined,
    EventAttendes: [],
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [Landing, setLanding] = React.useState(initialValues.Landing);
  const [careerID, setCareerID] = React.useState(initialValues.careerID);
  const [Form, setForm] = React.useState(initialValues.Form);
  const [EventAttendes, setEventAttendes] = React.useState(
    initialValues.EventAttendes
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = eventRecord
      ? {
          ...initialValues,
          ...eventRecord,
          Landing,
          careerID,
          Form,
          EventAttendes: linkedEventAttendes,
        }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setLanding(cleanValues.Landing);
    setCurrentLandingValue(undefined);
    setCurrentLandingDisplayValue("");
    setCareerID(cleanValues.careerID);
    setCurrentCareerIDValue(undefined);
    setCurrentCareerIDDisplayValue("");
    setForm(cleanValues.Form);
    setCurrentFormValue(undefined);
    setCurrentFormDisplayValue("");
    setEventAttendes(cleanValues.EventAttendes ?? []);
    setCurrentEventAttendesValue(undefined);
    setCurrentEventAttendesDisplayValue("");
    setErrors({});
  };
  const [eventRecord, setEventRecord] = React.useState(eventModelProp);
  const [linkedEventAttendes, setLinkedEventAttendes] = React.useState([]);
  const canUnlinkEventAttendes = false;
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Event, idProp)
        : eventModelProp;
      setEventRecord(record);
      const LandingRecord = record ? await record.Landing : undefined;
      setLanding(LandingRecord);
      const careerIDRecord = record ? await record.careerID : undefined;
      setCareerID(careerIDRecord);
      const FormRecord = record ? await record.Form : undefined;
      setForm(FormRecord);
      const linkedEventAttendes = record
        ? await record.EventAttendes.toArray()
        : [];
      setLinkedEventAttendes(linkedEventAttendes);
    };
    queryData();
  }, [idProp, eventModelProp]);
  React.useEffect(resetStateValues, [
    eventRecord,
    Landing,
    careerID,
    Form,
    linkedEventAttendes,
  ]);
  const [currentLandingDisplayValue, setCurrentLandingDisplayValue] =
    React.useState("");
  const [currentLandingValue, setCurrentLandingValue] =
    React.useState(undefined);
  const LandingRef = React.createRef();
  const [currentCareerIDDisplayValue, setCurrentCareerIDDisplayValue] =
    React.useState("");
  const [currentCareerIDValue, setCurrentCareerIDValue] =
    React.useState(undefined);
  const careerIDRef = React.createRef();
  const [currentFormDisplayValue, setCurrentFormDisplayValue] =
    React.useState("");
  const [currentFormValue, setCurrentFormValue] = React.useState(undefined);
  const FormRef = React.createRef();
  const [
    currentEventAttendesDisplayValue,
    setCurrentEventAttendesDisplayValue,
  ] = React.useState("");
  const [currentEventAttendesValue, setCurrentEventAttendesValue] =
    React.useState(undefined);
  const EventAttendesRef = React.createRef();
  const getIDValue = {
    Landing: (r) => JSON.stringify({ id: r?.id }),
    Form: (r) => JSON.stringify({ id: r?.id }),
    EventAttendes: (r) => JSON.stringify({ id: r?.id }),
  };
  const LandingIdSet = new Set(
    Array.isArray(Landing)
      ? Landing.map((r) => getIDValue.Landing?.(r))
      : getIDValue.Landing?.(Landing)
  );
  const FormIdSet = new Set(
    Array.isArray(Form)
      ? Form.map((r) => getIDValue.Form?.(r))
      : getIDValue.Form?.(Form)
  );
  const EventAttendesIdSet = new Set(
    Array.isArray(EventAttendes)
      ? EventAttendes.map((r) => getIDValue.EventAttendes?.(r))
      : getIDValue.EventAttendes?.(EventAttendes)
  );
  const landingRecords = useDataStoreBinding({
    type: "collection",
    model: Landing0,
  }).items;
  const careerRecords = useDataStoreBinding({
    type: "collection",
    model: Career,
  }).items;
  const formRecords = useDataStoreBinding({
    type: "collection",
    model: Form0,
  }).items;
  const eventAttendeRecords = useDataStoreBinding({
    type: "collection",
    model: EventAttende,
  }).items;
  const getDisplayValue = {
    Landing: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    careerID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    Form: (r) => r?.id,
    EventAttendes: (r) =>
      `${r?.authorized ? r?.authorized + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [],
    description: [],
    Landing: [],
    careerID: [{ type: "Required" }],
    Form: [],
    EventAttendes: [],
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
          title,
          description,
          Landing,
          careerID,
          Form,
          EventAttendes,
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
            if (typeof value === "string" && value.trim() === "") {
              modelFields[key] = undefined;
            }
          });
          const promises = [];
          const landingToUnlink = await eventRecord.Landing;
          if (landingToUnlink) {
            promises.push(
              DataStore.save(
                Landing0.copyOf(landingToUnlink, (updated) => {
                  updated.Event = undefined;
                  updated.landingEventId = undefined;
                })
              )
            );
          }
          const landingToLink = modelFields.Landing;
          if (landingToLink) {
            promises.push(
              DataStore.save(
                Landing0.copyOf(landingToLink, (updated) => {
                  updated.Event = eventRecord;
                })
              )
            );
            const eventToUnlink = await landingToLink.Event;
            if (eventToUnlink) {
              promises.push(
                DataStore.save(
                  Event.copyOf(eventToUnlink, (updated) => {
                    updated.Landing = undefined;
                    updated.eventLandingId = undefined;
                  })
                )
              );
            }
          }
          const formToUnlink = await eventRecord.Form;
          if (formToUnlink) {
            promises.push(
              DataStore.save(
                Form0.copyOf(formToUnlink, (updated) => {
                  updated.Event = undefined;
                  updated.formEventId = undefined;
                })
              )
            );
          }
          const formToLink = modelFields.Form;
          if (formToLink) {
            promises.push(
              DataStore.save(
                Form0.copyOf(formToLink, (updated) => {
                  updated.Event = eventRecord;
                })
              )
            );
            const eventToUnlink = await formToLink.Event;
            if (eventToUnlink) {
              promises.push(
                DataStore.save(
                  Event.copyOf(eventToUnlink, (updated) => {
                    updated.Form = undefined;
                    updated.eventFormId = undefined;
                  })
                )
              );
            }
          }
          const eventAttendesToLink = [];
          const eventAttendesToUnLink = [];
          const eventAttendesSet = new Set();
          const linkedEventAttendesSet = new Set();
          EventAttendes.forEach((r) =>
            eventAttendesSet.add(getIDValue.EventAttendes?.(r))
          );
          linkedEventAttendes.forEach((r) =>
            linkedEventAttendesSet.add(getIDValue.EventAttendes?.(r))
          );
          linkedEventAttendes.forEach((r) => {
            if (!eventAttendesSet.has(getIDValue.EventAttendes?.(r))) {
              eventAttendesToUnLink.push(r);
            }
          });
          EventAttendes.forEach((r) => {
            if (!linkedEventAttendesSet.has(getIDValue.EventAttendes?.(r))) {
              eventAttendesToLink.push(r);
            }
          });
          eventAttendesToUnLink.forEach((original) => {
            if (!canUnlinkEventAttendes) {
              throw Error(
                `EventAttende ${original.id} cannot be unlinked from Event because eventID is a required field.`
              );
            }
            promises.push(
              DataStore.save(
                EventAttende.copyOf(original, (updated) => {
                  updated.eventID = null;
                })
              )
            );
          });
          eventAttendesToLink.forEach((original) => {
            promises.push(
              DataStore.save(
                EventAttende.copyOf(original, (updated) => {
                  updated.eventID = eventRecord.id;
                })
              )
            );
          });
          const modelFieldsToSave = {
            title: modelFields.title,
            description: modelFields.description,
            Landing: modelFields.Landing,
            careerID: modelFields.careerID,
            Form: modelFields.Form,
          };
          promises.push(
            DataStore.save(
              Event.copyOf(eventRecord, (updated) => {
                Object.assign(updated, modelFieldsToSave);
                if (!modelFieldsToSave.Landing) {
                  updated.eventLandingId = undefined;
                }
                if (!modelFieldsToSave.Form) {
                  updated.eventFormId = undefined;
                }
              })
            )
          );
          await Promise.all(promises);
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
        label="Title"
        isRequired={false}
        isReadOnly={false}
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              Landing,
              careerID,
              Form,
              EventAttendes,
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
        label="Description"
        isRequired={false}
        isReadOnly={false}
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description: value,
              Landing,
              careerID,
              Form,
              EventAttendes,
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
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              title,
              description,
              Landing: value,
              careerID,
              Form,
              EventAttendes,
            };
            const result = onChange(modelFields);
            value = result?.Landing ?? value;
          }
          setLanding(value);
          setCurrentLandingValue(undefined);
          setCurrentLandingDisplayValue("");
        }}
        currentFieldValue={currentLandingValue}
        label={"Landing"}
        items={Landing ? [Landing] : []}
        hasError={errors?.Landing?.hasError}
        errorMessage={errors?.Landing?.errorMessage}
        getBadgeText={getDisplayValue.Landing}
        setFieldValue={(model) => {
          setCurrentLandingDisplayValue(
            model ? getDisplayValue.Landing(model) : ""
          );
          setCurrentLandingValue(model);
        }}
        inputFieldRef={LandingRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Landing"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search Landing"
          value={currentLandingDisplayValue}
          options={landingRecords
            .filter((r) => !LandingIdSet.has(getIDValue.Landing?.(r)))
            .map((r) => ({
              id: getIDValue.Landing?.(r),
              label: getDisplayValue.Landing?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentLandingValue(
              landingRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentLandingDisplayValue(label);
            runValidationTasks("Landing", label);
          }}
          onClear={() => {
            setCurrentLandingDisplayValue("");
          }}
          defaultValue={Landing}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.Landing?.hasError) {
              runValidationTasks("Landing", value);
            }
            setCurrentLandingDisplayValue(value);
            setCurrentLandingValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks("Landing", currentLandingDisplayValue)
          }
          errorMessage={errors.Landing?.errorMessage}
          hasError={errors.Landing?.hasError}
          ref={LandingRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "Landing")}
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
              Landing,
              careerID: value,
              Form,
              EventAttendes,
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
            <span>Career id</span>
            <span style={{ color: "red" }}>*</span>
          </span>
        }
        items={careerID ? [careerID] : []}
        hasError={errors?.careerID?.hasError}
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
              <span>Career id</span>
              <span style={{ color: "red" }}>*</span>
            </span>
          }
          isRequired={true}
          isReadOnly={false}
          placeholder="Search Career"
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
          defaultValue={careerID}
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
              Landing,
              careerID,
              Form: value,
              EventAttendes,
            };
            const result = onChange(modelFields);
            value = result?.Form ?? value;
          }
          setForm(value);
          setCurrentFormValue(undefined);
          setCurrentFormDisplayValue("");
        }}
        currentFieldValue={currentFormValue}
        label={"Form"}
        items={Form ? [Form] : []}
        hasError={errors?.Form?.hasError}
        errorMessage={errors?.Form?.errorMessage}
        getBadgeText={getDisplayValue.Form}
        setFieldValue={(model) => {
          setCurrentFormDisplayValue(model ? getDisplayValue.Form(model) : "");
          setCurrentFormValue(model);
        }}
        inputFieldRef={FormRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Form"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search Form"
          value={currentFormDisplayValue}
          options={formRecords
            .filter((r) => !FormIdSet.has(getIDValue.Form?.(r)))
            .map((r) => ({
              id: getIDValue.Form?.(r),
              label: getDisplayValue.Form?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentFormValue(
              formRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentFormDisplayValue(label);
            runValidationTasks("Form", label);
          }}
          onClear={() => {
            setCurrentFormDisplayValue("");
          }}
          defaultValue={Form}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.Form?.hasError) {
              runValidationTasks("Form", value);
            }
            setCurrentFormDisplayValue(value);
            setCurrentFormValue(undefined);
          }}
          onBlur={() => runValidationTasks("Form", currentFormDisplayValue)}
          errorMessage={errors.Form?.errorMessage}
          hasError={errors.Form?.hasError}
          ref={FormRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "Form")}
        ></Autocomplete>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              Landing,
              careerID,
              Form,
              EventAttendes: values,
            };
            const result = onChange(modelFields);
            values = result?.EventAttendes ?? values;
          }
          setEventAttendes(values);
          setCurrentEventAttendesValue(undefined);
          setCurrentEventAttendesDisplayValue("");
        }}
        currentFieldValue={currentEventAttendesValue}
        label={"Event attendes"}
        items={EventAttendes}
        hasError={errors?.EventAttendes?.hasError}
        errorMessage={errors?.EventAttendes?.errorMessage}
        getBadgeText={getDisplayValue.EventAttendes}
        setFieldValue={(model) => {
          setCurrentEventAttendesDisplayValue(
            model ? getDisplayValue.EventAttendes(model) : ""
          );
          setCurrentEventAttendesValue(model);
        }}
        inputFieldRef={EventAttendesRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Event attendes"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search EventAttende"
          value={currentEventAttendesDisplayValue}
          options={eventAttendeRecords
            .filter(
              (r) => !EventAttendesIdSet.has(getIDValue.EventAttendes?.(r))
            )
            .map((r) => ({
              id: getIDValue.EventAttendes?.(r),
              label: getDisplayValue.EventAttendes?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventAttendesValue(
              eventAttendeRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentEventAttendesDisplayValue(label);
            runValidationTasks("EventAttendes", label);
          }}
          onClear={() => {
            setCurrentEventAttendesDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.EventAttendes?.hasError) {
              runValidationTasks("EventAttendes", value);
            }
            setCurrentEventAttendesDisplayValue(value);
            setCurrentEventAttendesValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks(
              "EventAttendes",
              currentEventAttendesDisplayValue
            )
          }
          errorMessage={errors.EventAttendes?.errorMessage}
          hasError={errors.EventAttendes?.hasError}
          ref={EventAttendesRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "EventAttendes")}
        ></Autocomplete>
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
