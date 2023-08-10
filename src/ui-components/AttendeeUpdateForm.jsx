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
import { Attendee, EventAttendee } from "../models";
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
export default function AttendeeUpdateForm(props) {
  const {
    id: idProp,
    attendee: attendeeModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    name: "",
    type: "",
    age: "",
    position: "",
    EventAttendees: [],
  };
  const [name, setName] = React.useState(initialValues.name);
  const [type, setType] = React.useState(initialValues.type);
  const [age, setAge] = React.useState(initialValues.age);
  const [position, setPosition] = React.useState(initialValues.position);
  const [EventAttendees, setEventAttendees] = React.useState(
    initialValues.EventAttendees
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = attendeeRecord
      ? {
          ...initialValues,
          ...attendeeRecord,
          EventAttendees: linkedEventAttendees,
        }
      : initialValues;
    setName(cleanValues.name);
    setType(cleanValues.type);
    setAge(cleanValues.age);
    setPosition(cleanValues.position);
    setEventAttendees(cleanValues.EventAttendees ?? []);
    setCurrentEventAttendeesValue(undefined);
    setCurrentEventAttendeesDisplayValue("");
    setErrors({});
  };
  const [attendeeRecord, setAttendeeRecord] = React.useState(attendeeModelProp);
  const [linkedEventAttendees, setLinkedEventAttendees] = React.useState([]);
  const canUnlinkEventAttendees = false;
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Attendee, idProp)
        : attendeeModelProp;
      setAttendeeRecord(record);
      const linkedEventAttendees = record
        ? await record.EventAttendees.toArray()
        : [];
      setLinkedEventAttendees(linkedEventAttendees);
    };
    queryData();
  }, [idProp, attendeeModelProp]);
  React.useEffect(resetStateValues, [attendeeRecord, linkedEventAttendees]);
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
  const eventAttendeeRecords = useDataStoreBinding({
    type: "collection",
    model: EventAttendee,
  }).items;
  const getDisplayValue = {
    EventAttendees: (r) =>
      `${r?.authorized ? r?.authorized + " - " : ""}${r?.id}`,
  };
  const validations = {
    name: [],
    type: [],
    age: [],
    position: [],
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
          name,
          type,
          age,
          position,
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
                `EventAttendee ${original.id} cannot be unlinked from Attendee because attendeeID is a required field.`
              );
            }
            promises.push(
              DataStore.save(
                EventAttendee.copyOf(original, (updated) => {
                  updated.attendeeID = null;
                })
              )
            );
          });
          eventAttendeesToLink.forEach((original) => {
            promises.push(
              DataStore.save(
                EventAttendee.copyOf(original, (updated) => {
                  updated.attendeeID = attendeeRecord.id;
                })
              )
            );
          });
          const modelFieldsToSave = {
            name: modelFields.name,
            type: modelFields.type,
            age: modelFields.age,
            position: modelFields.position,
          };
          promises.push(
            DataStore.save(
              Attendee.copyOf(attendeeRecord, (updated) => {
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
      {...getOverrideProps(overrides, "AttendeeUpdateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={false}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              type,
              age,
              position,
              EventAttendees,
            };
            const result = onChange(modelFields);
            value = result?.name ?? value;
          }
          if (errors.name?.hasError) {
            runValidationTasks("name", value);
          }
          setName(value);
        }}
        onBlur={() => runValidationTasks("name", name)}
        errorMessage={errors.name?.errorMessage}
        hasError={errors.name?.hasError}
        {...getOverrideProps(overrides, "name")}
      ></TextField>
      <TextField
        label="Type"
        isRequired={false}
        isReadOnly={false}
        value={type}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type: value,
              age,
              position,
              EventAttendees,
            };
            const result = onChange(modelFields);
            value = result?.type ?? value;
          }
          if (errors.type?.hasError) {
            runValidationTasks("type", value);
          }
          setType(value);
        }}
        onBlur={() => runValidationTasks("type", type)}
        errorMessage={errors.type?.errorMessage}
        hasError={errors.type?.hasError}
        {...getOverrideProps(overrides, "type")}
      ></TextField>
      <TextField
        label="Age"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={age}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              name,
              type,
              age: value,
              position,
              EventAttendees,
            };
            const result = onChange(modelFields);
            value = result?.age ?? value;
          }
          if (errors.age?.hasError) {
            runValidationTasks("age", value);
          }
          setAge(value);
        }}
        onBlur={() => runValidationTasks("age", age)}
        errorMessage={errors.age?.errorMessage}
        hasError={errors.age?.hasError}
        {...getOverrideProps(overrides, "age")}
      ></TextField>
      <TextField
        label="Position"
        isRequired={false}
        isReadOnly={false}
        value={position}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name,
              type,
              age,
              position: value,
              EventAttendees,
            };
            const result = onChange(modelFields);
            value = result?.position ?? value;
          }
          if (errors.position?.hasError) {
            runValidationTasks("position", value);
          }
          setPosition(value);
        }}
        onBlur={() => runValidationTasks("position", position)}
        errorMessage={errors.position?.errorMessage}
        hasError={errors.position?.hasError}
        {...getOverrideProps(overrides, "position")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              type,
              age,
              position,
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
        <Button
          children="Reset"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          isDisabled={!(idProp || attendeeModelProp)}
          {...getOverrideProps(overrides, "ResetButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={
              !(idProp || attendeeModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
