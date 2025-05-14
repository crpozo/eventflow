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
import { PaymentLog, EventAttendee } from "../models";
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
export default function PaymentLogUpdateForm(props) {
  const {
    id: idProp,
    paymentLog: paymentLogModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    eventattendeeID: undefined,
    status: "",
    type: "",
  };
  const [eventattendeeID, setEventattendeeID] = React.useState(
    initialValues.eventattendeeID
  );
  const [status, setStatus] = React.useState(initialValues.status);
  const [type, setType] = React.useState(initialValues.type);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = paymentLogRecord
      ? { ...initialValues, ...paymentLogRecord, eventattendeeID }
      : initialValues;
    setEventattendeeID(cleanValues.eventattendeeID);
    setCurrentEventattendeeIDValue(undefined);
    setCurrentEventattendeeIDDisplayValue("");
    setStatus(cleanValues.status);
    setType(cleanValues.type);
    setErrors({});
  };
  const [paymentLogRecord, setPaymentLogRecord] =
    React.useState(paymentLogModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(PaymentLog, idProp)
        : paymentLogModelProp;
      setPaymentLogRecord(record);
      const eventattendeeIDRecord = record
        ? await record.eventattendeeID
        : undefined;
      setEventattendeeID(eventattendeeIDRecord);
    };
    queryData();
  }, [idProp, paymentLogModelProp]);
  React.useEffect(resetStateValues, [paymentLogRecord, eventattendeeID]);
  const [
    currentEventattendeeIDDisplayValue,
    setCurrentEventattendeeIDDisplayValue,
  ] = React.useState("");
  const [currentEventattendeeIDValue, setCurrentEventattendeeIDValue] =
    React.useState(undefined);
  const eventattendeeIDRef = React.createRef();
  const eventAttendeeRecords = useDataStoreBinding({
    type: "collection",
    model: EventAttendee,
  }).items;
  const getDisplayValue = {
    eventattendeeID: (r) => `${r?.email ? r?.email + " - " : ""}${r?.id}`,
  };
  const validations = {
    eventattendeeID: [{ type: "Required" }],
    status: [],
    type: [],
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
          eventattendeeID,
          status,
          type,
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
            PaymentLog.copyOf(paymentLogRecord, (updated) => {
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
      {...getOverrideProps(overrides, "PaymentLogUpdateForm")}
      {...rest}
    >
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              eventattendeeID: value,
              status,
              type,
            };
            const result = onChange(modelFields);
            value = result?.eventattendeeID ?? value;
          }
          setEventattendeeID(value);
          setCurrentEventattendeeIDValue(undefined);
        }}
        currentFieldValue={currentEventattendeeIDValue}
        label={"Eventattendee id"}
        items={eventattendeeID ? [eventattendeeID] : []}
        hasError={errors?.eventattendeeID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "eventattendeeID",
            currentEventattendeeIDValue
          )
        }
        errorMessage={errors?.eventattendeeID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.eventattendeeID(
                eventAttendeeRecords.find((r) => r.id === value)
              )
            : ""
        }
        setFieldValue={(value) => {
          setCurrentEventattendeeIDDisplayValue(
            value
              ? getDisplayValue.eventattendeeID(
                  eventAttendeeRecords.find((r) => r.id === value)
                )
              : ""
          );
          setCurrentEventattendeeIDValue(value);
        }}
        inputFieldRef={eventattendeeIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Eventattendee id"
          isRequired={true}
          isReadOnly={false}
          placeholder="Search EventAttendee"
          value={currentEventattendeeIDDisplayValue}
          options={eventAttendeeRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.eventattendeeID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventattendeeIDValue(id);
            setCurrentEventattendeeIDDisplayValue(label);
            runValidationTasks("eventattendeeID", label);
          }}
          onClear={() => {
            setCurrentEventattendeeIDDisplayValue("");
          }}
          defaultValue={eventattendeeID}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.eventattendeeID?.hasError) {
              runValidationTasks("eventattendeeID", value);
            }
            setCurrentEventattendeeIDDisplayValue(value);
            setCurrentEventattendeeIDValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks("eventattendeeID", currentEventattendeeIDValue)
          }
          errorMessage={errors.eventattendeeID?.errorMessage}
          hasError={errors.eventattendeeID?.hasError}
          ref={eventattendeeIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "eventattendeeID")}
        ></Autocomplete>
      </ArrayField>
      <TextField
        label="Status"
        isRequired={false}
        isReadOnly={false}
        value={status}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              eventattendeeID,
              status: value,
              type,
            };
            const result = onChange(modelFields);
            value = result?.status ?? value;
          }
          if (errors.status?.hasError) {
            runValidationTasks("status", value);
          }
          setStatus(value);
        }}
        onBlur={() => runValidationTasks("status", status)}
        errorMessage={errors.status?.errorMessage}
        hasError={errors.status?.hasError}
        {...getOverrideProps(overrides, "status")}
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
              eventattendeeID,
              status,
              type: value,
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
          isDisabled={!(idProp || paymentLogModelProp)}
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
              !(idProp || paymentLogModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
