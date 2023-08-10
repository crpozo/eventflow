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
import { Event, EventAttendee, Career } from "../models";
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
    careerID: undefined,
    EventAttendes: "",
    EventAttendees: [],
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [careerID, setCareerID] = React.useState(initialValues.careerID);
  const [EventAttendes, setEventAttendes] = React.useState(
    initialValues.EventAttendes
  );
  const [EventAttendees, setEventAttendees] = React.useState(
    initialValues.EventAttendees
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = eventRecord
      ? {
          ...initialValues,
          ...eventRecord,
          careerID,
          EventAttendees: linkedEventAttendees,
        }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setCareerID(cleanValues.careerID);
    setCurrentCareerIDValue(undefined);
    setCurrentCareerIDDisplayValue("");
    setEventAttendes(cleanValues.EventAttendes);
    setEventAttendees(cleanValues.EventAttendees ?? []);
    setCurrentEventAttendeesValue(undefined);
    setCurrentEventAttendeesDisplayValue("");
    setErrors({});
  };
  const [eventRecord, setEventRecord] = React.useState(eventModelProp);
  const [linkedEventAttendees, setLinkedEventAttendees] = React.useState([]);
  const canUnlinkEventAttendees = false;
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Event, idProp)
        : eventModelProp;
      setEventRecord(record);
      const careerIDRecord = record ? await record.careerID : undefined;
      setCareerID(careerIDRecord);
      const linkedEventAttendees = record
        ? await record.EventAttendees.toArray()
        : [];
      setLinkedEventAttendees(linkedEventAttendees);
    };
    queryData();
  }, [idProp, eventModelProp]);
  React.useEffect(resetStateValues, [
    eventRecord,
    careerID,
    linkedEventAttendees,
  ]);
  const [currentCareerIDDisplayValue, setCurrentCareerIDDisplayValue] =
    React.useState("");
  const [currentCareerIDValue, setCurrentCareerIDValue] =
    React.useState(undefined);
  const careerIDRef = React.createRef();
  const [
    currentEventAttendeesDisplayValue,
    setCurrentEventAttendeesDisplayValue,
  ] = React.useState("");
  const [currentEventAttendeesValue, setCurrentEventAttendeesValue] =
    React.useState(undefined);
  const EventAttendeesRef = React.createRef();
  const getIDValue = {
    EventAttendees: (r) => JSON.stringify({ id: r?.id }),
  };
  const EventAttendeesIdSet = new Set(
    Array.isArray(EventAttendees)
      ? EventAttendees.map((r) => getIDValue.EventAttendees?.(r))
      : getIDValue.EventAttendees?.(EventAttendees)
  );
  const careerRecords = useDataStoreBinding({
    type: "collection",
    model: Career,
  }).items;
  const eventAttendeeRecords = useDataStoreBinding({
    type: "collection",
    model: EventAttendee,
  }).items;
  const getDisplayValue = {
    careerID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    EventAttendees: (r) =>
      `${r?.authorized ? r?.authorized + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [],
    description: [],
    careerID: [{ type: "Required" }],
    EventAttendes: [],
    EventAttendees: [],
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
          careerID,
          EventAttendes,
          EventAttendees,
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
          const eventAttendeesToLink = [];
          const eventAttendeesToUnLink = [];
          const eventAttendeesSet = new Set();
          const linkedEventAttendeesSet = new Set();
          EventAttendees.forEach((r) =>
            eventAttendeesSet.add(getIDValue.EventAttendees?.(r))
          );
          linkedEventAttendees.forEach((r) =>
            linkedEventAttendeesSet.add(getIDValue.EventAttendees?.(r))
          );
          linkedEventAttendees.forEach((r) => {
            if (!eventAttendeesSet.has(getIDValue.EventAttendees?.(r))) {
              eventAttendeesToUnLink.push(r);
            }
          });
          EventAttendees.forEach((r) => {
            if (!linkedEventAttendeesSet.has(getIDValue.EventAttendees?.(r))) {
              eventAttendeesToLink.push(r);
            }
          });
          eventAttendeesToUnLink.forEach((original) => {
            if (!canUnlinkEventAttendees) {
              throw Error(
                `EventAttendee ${original.id} cannot be unlinked from Event because eventID is a required field.`
              );
            }
            promises.push(
              DataStore.save(
                EventAttendee.copyOf(original, (updated) => {
                  updated.eventID = null;
                })
              )
            );
          });
          eventAttendeesToLink.forEach((original) => {
            promises.push(
              DataStore.save(
                EventAttendee.copyOf(original, (updated) => {
                  updated.eventID = eventRecord.id;
                })
              )
            );
          });
          const modelFieldsToSave = {
            title: modelFields.title,
            description: modelFields.description,
            careerID: modelFields.careerID,
          };
          promises.push(
            DataStore.save(
              Event.copyOf(eventRecord, (updated) => {
                Object.assign(updated, modelFieldsToSave);
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
              careerID,
              EventAttendes,
              EventAttendees,
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
              careerID,
              EventAttendes,
              EventAttendees,
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
              careerID: value,
              EventAttendes,
              EventAttendees,
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
      <TextField
        label="Label"
        value={EventAttendes}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              careerID,
              EventAttendes: value,
              EventAttendees,
            };
            const result = onChange(modelFields);
            value = result?.EventAttendes ?? value;
          }
          if (errors.EventAttendes?.hasError) {
            runValidationTasks("EventAttendes", value);
          }
          setEventAttendes(value);
        }}
        onBlur={() => runValidationTasks("EventAttendes", EventAttendes)}
        errorMessage={errors.EventAttendes?.errorMessage}
        hasError={errors.EventAttendes?.hasError}
        {...getOverrideProps(overrides, "EventAttendes")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              careerID,
              EventAttendes,
              EventAttendees: values,
            };
            const result = onChange(modelFields);
            values = result?.EventAttendees ?? values;
          }
          setEventAttendees(values);
          setCurrentEventAttendeesValue(undefined);
          setCurrentEventAttendeesDisplayValue("");
        }}
        currentFieldValue={currentEventAttendeesValue}
        label={"Event attendees"}
        items={EventAttendees}
        hasError={errors?.EventAttendees?.hasError}
        errorMessage={errors?.EventAttendees?.errorMessage}
        getBadgeText={getDisplayValue.EventAttendees}
        setFieldValue={(model) => {
          setCurrentEventAttendeesDisplayValue(
            model ? getDisplayValue.EventAttendees(model) : ""
          );
          setCurrentEventAttendeesValue(model);
        }}
        inputFieldRef={EventAttendeesRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Event attendees"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search EventAttendee"
          value={currentEventAttendeesDisplayValue}
          options={eventAttendeeRecords
            .filter(
              (r) => !EventAttendeesIdSet.has(getIDValue.EventAttendees?.(r))
            )
            .map((r) => ({
              id: getIDValue.EventAttendees?.(r),
              label: getDisplayValue.EventAttendees?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventAttendeesValue(
              eventAttendeeRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentEventAttendeesDisplayValue(label);
            runValidationTasks("EventAttendees", label);
          }}
          onClear={() => {
            setCurrentEventAttendeesDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.EventAttendees?.hasError) {
              runValidationTasks("EventAttendees", value);
            }
            setCurrentEventAttendeesDisplayValue(value);
            setCurrentEventAttendeesValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks(
              "EventAttendees",
              currentEventAttendeesDisplayValue
            )
          }
          errorMessage={errors.EventAttendees?.errorMessage}
          hasError={errors.EventAttendees?.hasError}
          ref={EventAttendeesRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "EventAttendees")}
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
