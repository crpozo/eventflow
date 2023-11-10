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
  TextAreaField,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { EventAttendee, Event, Attendee } from "../models";
import {
  fetchByPath,
  getOverrideProps,
  useDataStoreBinding,
  validateField,
} from "./utils";
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
export default function EventAttendeeUpdateForm(props) {
  const {
    id: idProp,
    eventAttendee: eventAttendeeModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    eventID: undefined,
    attendeeID: undefined,
    authorized: false,
    checkIn: false,
    formAnswers: "",
    ticket: "",
    email: "",
    allowContact: false,
    quantity: "",
    scanned: "",
    profileURL: "",
  };
  const [eventID, setEventID] = React.useState(initialValues.eventID);
  const [attendeeID, setAttendeeID] = React.useState(initialValues.attendeeID);
  const [authorized, setAuthorized] = React.useState(initialValues.authorized);
  const [checkIn, setCheckIn] = React.useState(initialValues.checkIn);
  const [formAnswers, setFormAnswers] = React.useState(
    initialValues.formAnswers
  );
  const [ticket, setTicket] = React.useState(initialValues.ticket);
  const [email, setEmail] = React.useState(initialValues.email);
  const [allowContact, setAllowContact] = React.useState(
    initialValues.allowContact
  );
  const [quantity, setQuantity] = React.useState(initialValues.quantity);
  const [scanned, setScanned] = React.useState(initialValues.scanned);
  const [profileURL, setProfileURL] = React.useState(initialValues.profileURL);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = eventAttendeeRecord
      ? { ...initialValues, ...eventAttendeeRecord, eventID, attendeeID }
      : initialValues;
    setEventID(cleanValues.eventID);
    setCurrentEventIDValue(undefined);
    setCurrentEventIDDisplayValue("");
    setAttendeeID(cleanValues.attendeeID);
    setCurrentAttendeeIDValue(undefined);
    setCurrentAttendeeIDDisplayValue("");
    setAuthorized(cleanValues.authorized);
    setCheckIn(cleanValues.checkIn);
    setFormAnswers(
      typeof cleanValues.formAnswers === "string" ||
        cleanValues.formAnswers === null
        ? cleanValues.formAnswers
        : JSON.stringify(cleanValues.formAnswers)
    );
    setTicket(cleanValues.ticket);
    setEmail(cleanValues.email);
    setAllowContact(cleanValues.allowContact);
    setQuantity(cleanValues.quantity);
    setScanned(cleanValues.scanned);
    setProfileURL(cleanValues.profileURL);
    setErrors({});
  };
  const [eventAttendeeRecord, setEventAttendeeRecord] = React.useState(
    eventAttendeeModelProp
  );
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(EventAttendee, idProp)
        : eventAttendeeModelProp;
      setEventAttendeeRecord(record);
      const eventIDRecord = record ? await record.eventID : undefined;
      setEventID(eventIDRecord);
      const attendeeIDRecord = record ? await record.attendeeID : undefined;
      setAttendeeID(attendeeIDRecord);
    };
    queryData();
  }, [idProp, eventAttendeeModelProp]);
  React.useEffect(resetStateValues, [eventAttendeeRecord, eventID, attendeeID]);
  const [currentEventIDDisplayValue, setCurrentEventIDDisplayValue] =
    React.useState("");
  const [currentEventIDValue, setCurrentEventIDValue] =
    React.useState(undefined);
  const eventIDRef = React.createRef();
  const [currentAttendeeIDDisplayValue, setCurrentAttendeeIDDisplayValue] =
    React.useState("");
  const [currentAttendeeIDValue, setCurrentAttendeeIDValue] =
    React.useState(undefined);
  const attendeeIDRef = React.createRef();
  const eventRecords = useDataStoreBinding({
    type: "collection",
    model: Event,
  }).items;
  const attendeeRecords = useDataStoreBinding({
    type: "collection",
    model: Attendee,
  }).items;
  const getDisplayValue = {
    eventID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    attendeeID: (r) => r?.id,
  };
  const validations = {
    eventID: [{ type: "Required" }],
    attendeeID: [{ type: "Required" }],
    authorized: [],
    checkIn: [],
    formAnswers: [{ type: "JSON" }],
    ticket: [],
    email: [],
    allowContact: [],
    quantity: [],
    scanned: [],
    profileURL: [],
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
          eventID,
          attendeeID,
          authorized,
          checkIn,
          formAnswers,
          ticket,
          email,
          allowContact,
          quantity,
          scanned,
          profileURL,
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
            EventAttendee.copyOf(eventAttendeeRecord, (updated) => {
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
      {...getOverrideProps(overrides, "EventAttendeeUpdateForm")}
      {...rest}
    >
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              eventID: value,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.eventID ?? value;
          }
          setEventID(value);
          setCurrentEventIDValue(undefined);
        }}
        currentFieldValue={currentEventIDValue}
        label={"Event id"}
        items={eventID ? [eventID] : []}
        hasError={errors?.eventID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("eventID", currentEventIDValue)
        }
        errorMessage={errors?.eventID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.eventID(eventRecords.find((r) => r.id === value))
            : ""
        }
        setFieldValue={(value) => {
          setCurrentEventIDDisplayValue(
            value
              ? getDisplayValue.eventID(
                  eventRecords.find((r) => r.id === value)
                )
              : ""
          );
          setCurrentEventIDValue(value);
        }}
        inputFieldRef={eventIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Event id"
          isRequired={true}
          isReadOnly={false}
          placeholder="Search Event"
          value={currentEventIDDisplayValue}
          options={eventRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.eventID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventIDValue(id);
            setCurrentEventIDDisplayValue(label);
            runValidationTasks("eventID", label);
          }}
          onClear={() => {
            setCurrentEventIDDisplayValue("");
          }}
          defaultValue={eventID}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.eventID?.hasError) {
              runValidationTasks("eventID", value);
            }
            setCurrentEventIDDisplayValue(value);
            setCurrentEventIDValue(undefined);
          }}
          onBlur={() => runValidationTasks("eventID", currentEventIDValue)}
          errorMessage={errors.eventID?.errorMessage}
          hasError={errors.eventID?.hasError}
          ref={eventIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "eventID")}
        ></Autocomplete>
      </ArrayField>
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID: value,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.attendeeID ?? value;
          }
          setAttendeeID(value);
          setCurrentAttendeeIDValue(undefined);
        }}
        currentFieldValue={currentAttendeeIDValue}
        label={"Attendee id"}
        items={attendeeID ? [attendeeID] : []}
        hasError={errors?.attendeeID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("attendeeID", currentAttendeeIDValue)
        }
        errorMessage={errors?.attendeeID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.attendeeID(
                attendeeRecords.find((r) => r.id === value)
              )
            : ""
        }
        setFieldValue={(value) => {
          setCurrentAttendeeIDDisplayValue(
            value
              ? getDisplayValue.attendeeID(
                  attendeeRecords.find((r) => r.id === value)
                )
              : ""
          );
          setCurrentAttendeeIDValue(value);
        }}
        inputFieldRef={attendeeIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Attendee id"
          isRequired={true}
          isReadOnly={false}
          placeholder="Search Attendee"
          value={currentAttendeeIDDisplayValue}
          options={attendeeRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.attendeeID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentAttendeeIDValue(id);
            setCurrentAttendeeIDDisplayValue(label);
            runValidationTasks("attendeeID", label);
          }}
          onClear={() => {
            setCurrentAttendeeIDDisplayValue("");
          }}
          defaultValue={attendeeID}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.attendeeID?.hasError) {
              runValidationTasks("attendeeID", value);
            }
            setCurrentAttendeeIDDisplayValue(value);
            setCurrentAttendeeIDValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks("attendeeID", currentAttendeeIDValue)
          }
          errorMessage={errors.attendeeID?.errorMessage}
          hasError={errors.attendeeID?.hasError}
          ref={attendeeIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "attendeeID")}
        ></Autocomplete>
      </ArrayField>
      <SwitchField
        label="Authorized"
        defaultChecked={false}
        isDisabled={false}
        isChecked={authorized}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized: value,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
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
              eventID,
              attendeeID,
              authorized,
              checkIn: value,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
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
      <TextAreaField
        label="Form answers"
        isRequired={false}
        isReadOnly={false}
        value={formAnswers}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers: value,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.formAnswers ?? value;
          }
          if (errors.formAnswers?.hasError) {
            runValidationTasks("formAnswers", value);
          }
          setFormAnswers(value);
        }}
        onBlur={() => runValidationTasks("formAnswers", formAnswers)}
        errorMessage={errors.formAnswers?.errorMessage}
        hasError={errors.formAnswers?.hasError}
        {...getOverrideProps(overrides, "formAnswers")}
      ></TextAreaField>
      <TextField
        label="Ticket"
        isRequired={false}
        isReadOnly={false}
        value={ticket}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket: value,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.ticket ?? value;
          }
          if (errors.ticket?.hasError) {
            runValidationTasks("ticket", value);
          }
          setTicket(value);
        }}
        onBlur={() => runValidationTasks("ticket", ticket)}
        errorMessage={errors.ticket?.errorMessage}
        hasError={errors.ticket?.hasError}
        {...getOverrideProps(overrides, "ticket")}
      ></TextField>
      <TextField
        label="Email"
        isRequired={false}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email: value,
              allowContact,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <SwitchField
        label="Allow contact"
        defaultChecked={false}
        isDisabled={false}
        isChecked={allowContact}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact: value,
              quantity,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.allowContact ?? value;
          }
          if (errors.allowContact?.hasError) {
            runValidationTasks("allowContact", value);
          }
          setAllowContact(value);
        }}
        onBlur={() => runValidationTasks("allowContact", allowContact)}
        errorMessage={errors.allowContact?.errorMessage}
        hasError={errors.allowContact?.hasError}
        {...getOverrideProps(overrides, "allowContact")}
      ></SwitchField>
      <TextField
        label="Quantity"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={quantity}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity: value,
              scanned,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.quantity ?? value;
          }
          if (errors.quantity?.hasError) {
            runValidationTasks("quantity", value);
          }
          setQuantity(value);
        }}
        onBlur={() => runValidationTasks("quantity", quantity)}
        errorMessage={errors.quantity?.errorMessage}
        hasError={errors.quantity?.hasError}
        {...getOverrideProps(overrides, "quantity")}
      ></TextField>
      <TextField
        label="Scanned"
        isRequired={false}
        isReadOnly={false}
        type="number"
        step="any"
        value={scanned}
        onChange={(e) => {
          let value = isNaN(parseInt(e.target.value))
            ? e.target.value
            : parseInt(e.target.value);
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned: value,
              profileURL,
            };
            const result = onChange(modelFields);
            value = result?.scanned ?? value;
          }
          if (errors.scanned?.hasError) {
            runValidationTasks("scanned", value);
          }
          setScanned(value);
        }}
        onBlur={() => runValidationTasks("scanned", scanned)}
        errorMessage={errors.scanned?.errorMessage}
        hasError={errors.scanned?.hasError}
        {...getOverrideProps(overrides, "scanned")}
      ></TextField>
      <TextField
        label="Profile url"
        isRequired={false}
        isReadOnly={false}
        value={profileURL}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              eventID,
              attendeeID,
              authorized,
              checkIn,
              formAnswers,
              ticket,
              email,
              allowContact,
              quantity,
              scanned,
              profileURL: value,
            };
            const result = onChange(modelFields);
            value = result?.profileURL ?? value;
          }
          if (errors.profileURL?.hasError) {
            runValidationTasks("profileURL", value);
          }
          setProfileURL(value);
        }}
        onBlur={() => runValidationTasks("profileURL", profileURL)}
        errorMessage={errors.profileURL?.errorMessage}
        hasError={errors.profileURL?.hasError}
        {...getOverrideProps(overrides, "profileURL")}
      ></TextField>
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
          isDisabled={!(idProp || eventAttendeeModelProp)}
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
              !(idProp || eventAttendeeModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
