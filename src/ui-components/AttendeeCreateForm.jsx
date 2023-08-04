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
  SwitchField,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import {
  getOverrideProps,
  useDataStoreBinding,
} from "@aws-amplify/ui-react/internal";
import { Attendee, Event, EventAttendee } from "../models";
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
export default function AttendeeCreateForm(props) {
  const {
    clearOnSuccess = true,
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
    authorized: false,
    checkIn: false,
    events: [],
  };
  const [name, setName] = React.useState(initialValues.name);
  const [type, setType] = React.useState(initialValues.type);
  const [age, setAge] = React.useState(initialValues.age);
  const [position, setPosition] = React.useState(initialValues.position);
  const [authorized, setAuthorized] = React.useState(initialValues.authorized);
  const [checkIn, setCheckIn] = React.useState(initialValues.checkIn);
  const [events, setEvents] = React.useState(initialValues.events);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setName(initialValues.name);
    setType(initialValues.type);
    setAge(initialValues.age);
    setPosition(initialValues.position);
    setAuthorized(initialValues.authorized);
    setCheckIn(initialValues.checkIn);
    setEvents(initialValues.events);
    setCurrentEventsValue(undefined);
    setCurrentEventsDisplayValue("");
    setErrors({});
  };
  const [currentEventsDisplayValue, setCurrentEventsDisplayValue] =
    React.useState("");
  const [currentEventsValue, setCurrentEventsValue] = React.useState(undefined);
  const eventsRef = React.createRef();
  const getIDValue = {
    events: (r) => JSON.stringify({ id: r?.id }),
  };
  const eventsIdSet = new Set(
    Array.isArray(events)
      ? events.map((r) => getIDValue.events?.(r))
      : getIDValue.events?.(events)
  );
  const eventRecords = useDataStoreBinding({
    type: "collection",
    model: Event,
  }).items;
  const getDisplayValue = {
    events: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
  };
  const validations = {
    name: [],
    type: [],
    age: [],
    position: [],
    authorized: [],
    checkIn: [],
    events: [],
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
          authorized,
          checkIn,
          events,
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
          const modelFieldsToSave = {
            name: modelFields.name,
            type: modelFields.type,
            age: modelFields.age,
            position: modelFields.position,
            authorized: modelFields.authorized,
            checkIn: modelFields.checkIn,
          };
          const attendee = await DataStore.save(
            new Attendee(modelFieldsToSave)
          );
          const promises = [];
          promises.push(
            ...events.reduce((promises, event) => {
              promises.push(
                DataStore.save(
                  new EventAttendee({
                    attendee,
                    event,
                  })
                )
              );
              return promises;
            }, [])
          );
          await Promise.all(promises);
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
      {...getOverrideProps(overrides, "AttendeeCreateForm")}
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
              authorized,
              checkIn,
              events,
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
              authorized,
              checkIn,
              events,
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
              authorized,
              checkIn,
              events,
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
              authorized,
              checkIn,
              events,
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
      <SwitchField
        label="Authorized"
        defaultChecked={false}
        isDisabled={false}
        isChecked={authorized}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              type,
              age,
              position,
              authorized: value,
              checkIn,
              events,
            };
            const result = onChange(modelFields);
            value = result?.authorized ?? value;
          }
          if (errors.authorized?.hasError) {
            runValidationTasks("authorized", value);
          }
          setAuthorized(value);
        }}
        onBlur={() => runValidationTasks("authorized", authorized)}
        errorMessage={errors.authorized?.errorMessage}
        hasError={errors.authorized?.hasError}
        {...getOverrideProps(overrides, "authorized")}
      ></SwitchField>
      <SwitchField
        label="Check in"
        defaultChecked={false}
        isDisabled={false}
        isChecked={checkIn}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              name,
              type,
              age,
              position,
              authorized,
              checkIn: value,
              events,
            };
            const result = onChange(modelFields);
            value = result?.checkIn ?? value;
          }
          if (errors.checkIn?.hasError) {
            runValidationTasks("checkIn", value);
          }
          setCheckIn(value);
        }}
        onBlur={() => runValidationTasks("checkIn", checkIn)}
        errorMessage={errors.checkIn?.errorMessage}
        hasError={errors.checkIn?.hasError}
        {...getOverrideProps(overrides, "checkIn")}
      ></SwitchField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              type,
              age,
              position,
              authorized,
              checkIn,
              events: values,
            };
            const result = onChange(modelFields);
            values = result?.events ?? values;
          }
          setEvents(values);
          setCurrentEventsValue(undefined);
          setCurrentEventsDisplayValue("");
        }}
        currentFieldValue={currentEventsValue}
        label={"Events"}
        items={events}
        hasError={errors?.events?.hasError}
        errorMessage={errors?.events?.errorMessage}
        getBadgeText={getDisplayValue.events}
        setFieldValue={(model) => {
          setCurrentEventsDisplayValue(
            model ? getDisplayValue.events(model) : ""
          );
          setCurrentEventsValue(model);
        }}
        inputFieldRef={eventsRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Events"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search Event"
          value={currentEventsDisplayValue}
          options={eventRecords
            .filter((r) => !eventsIdSet.has(getIDValue.events?.(r)))
            .map((r) => ({
              id: getIDValue.events?.(r),
              label: getDisplayValue.events?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventsValue(
              eventRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentEventsDisplayValue(label);
            runValidationTasks("events", label);
          }}
          onClear={() => {
            setCurrentEventsDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.events?.hasError) {
              runValidationTasks("events", value);
            }
            setCurrentEventsDisplayValue(value);
            setCurrentEventsValue(undefined);
          }}
          onBlur={() => runValidationTasks("events", currentEventsDisplayValue)}
          errorMessage={errors.events?.errorMessage}
          hasError={errors.events?.hasError}
          ref={eventsRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "events")}
        ></Autocomplete>
      </ArrayField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
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
