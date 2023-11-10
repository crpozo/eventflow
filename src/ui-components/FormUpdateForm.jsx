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
  TextAreaField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Form, Event as Event0 } from "../models";
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
export default function FormUpdateForm(props) {
  const {
    id: idProp,
    form: formModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    questions: "",
    Event: undefined,
  };
  const [questions, setQuestions] = React.useState(initialValues.questions);
  const [Event, setEvent] = React.useState(initialValues.Event);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = formRecord
      ? { ...initialValues, ...formRecord, Event }
      : initialValues;
    setQuestions(
      typeof cleanValues.questions === "string" ||
        cleanValues.questions === null
        ? cleanValues.questions
        : JSON.stringify(cleanValues.questions)
    );
    setEvent(cleanValues.Event);
    setCurrentEventValue(undefined);
    setCurrentEventDisplayValue("");
    setErrors({});
  };
  const [formRecord, setFormRecord] = React.useState(formModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Form, idProp)
        : formModelProp;
      setFormRecord(record);
      const EventRecord = record ? await record.Event : undefined;
      setEvent(EventRecord);
    };
    queryData();
  }, [idProp, formModelProp]);
  React.useEffect(resetStateValues, [formRecord, Event]);
  const [currentEventDisplayValue, setCurrentEventDisplayValue] =
    React.useState("");
  const [currentEventValue, setCurrentEventValue] = React.useState(undefined);
  const EventRef = React.createRef();
  const getIDValue = {
    Event: (r) => JSON.stringify({ id: r?.id }),
  };
  const EventIdSet = new Set(
    Array.isArray(Event)
      ? Event.map((r) => getIDValue.Event?.(r))
      : getIDValue.Event?.(Event)
  );
  const eventRecords = useDataStoreBinding({
    type: "collection",
    model: Event0,
  }).items;
  const getDisplayValue = {
    Event: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
  };
  const validations = {
    questions: [{ type: "JSON" }],
    Event: [],
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
          questions,
          Event,
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
          const promises = [];
          const eventToUnlink = await formRecord.Event;
          if (eventToUnlink) {
            promises.push(
              DataStore.save(
                Event0.copyOf(eventToUnlink, (updated) => {
                  updated.Form = undefined;
                  updated.eventFormId = undefined;
                })
              )
            );
          }
          const eventToLink = modelFields.Event;
          if (eventToLink) {
            promises.push(
              DataStore.save(
                Event0.copyOf(eventToLink, (updated) => {
                  updated.Form = formRecord;
                })
              )
            );
            const formToUnlink = await eventToLink.Form;
            if (formToUnlink) {
              promises.push(
                DataStore.save(
                  Form.copyOf(formToUnlink, (updated) => {
                    updated.Event = undefined;
                    updated.formEventId = undefined;
                  })
                )
              );
            }
          }
          promises.push(
            DataStore.save(
              Form.copyOf(formRecord, (updated) => {
                Object.assign(updated, modelFields);
                if (!modelFields.Event) {
                  updated.formEventId = undefined;
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
      {...getOverrideProps(overrides, "FormUpdateForm")}
      {...rest}
    >
      <TextAreaField
        label="Questions"
        isRequired={false}
        isReadOnly={false}
        value={questions}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              questions: value,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.questions ?? value;
          }
          if (errors.questions?.hasError) {
            runValidationTasks("questions", value);
          }
          setQuestions(value);
        }}
        onBlur={() => runValidationTasks("questions", questions)}
        errorMessage={errors.questions?.errorMessage}
        hasError={errors.questions?.hasError}
        {...getOverrideProps(overrides, "questions")}
      ></TextAreaField>
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              questions,
              Event: value,
            };
            const result = onChange(modelFields);
            value = result?.Event ?? value;
          }
          setEvent(value);
          setCurrentEventValue(undefined);
          setCurrentEventDisplayValue("");
        }}
        currentFieldValue={currentEventValue}
        label={"Event"}
        items={Event ? [Event] : []}
        hasError={errors?.Event?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("Event", currentEventValue)
        }
        errorMessage={errors?.Event?.errorMessage}
        getBadgeText={getDisplayValue.Event}
        setFieldValue={(model) => {
          setCurrentEventDisplayValue(
            model ? getDisplayValue.Event(model) : ""
          );
          setCurrentEventValue(model);
        }}
        inputFieldRef={EventRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Event"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search Event"
          value={currentEventDisplayValue}
          options={eventRecords
            .filter((r) => !EventIdSet.has(getIDValue.Event?.(r)))
            .map((r) => ({
              id: getIDValue.Event?.(r),
              label: getDisplayValue.Event?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentEventValue(
              eventRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentEventDisplayValue(label);
            runValidationTasks("Event", label);
          }}
          onClear={() => {
            setCurrentEventDisplayValue("");
          }}
          defaultValue={Event}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.Event?.hasError) {
              runValidationTasks("Event", value);
            }
            setCurrentEventDisplayValue(value);
            setCurrentEventValue(undefined);
          }}
          onBlur={() => runValidationTasks("Event", currentEventDisplayValue)}
          errorMessage={errors.Event?.errorMessage}
          hasError={errors.Event?.hasError}
          ref={EventRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "Event")}
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
          isDisabled={!(idProp || formModelProp)}
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
              !(idProp || formModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
