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
import { Survey, Event as Event0 } from "../models";
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
export default function SurveyUpdateForm(props) {
  const {
    id: idProp,
    survey: surveyModelProp,
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
    active: false,
    emailSubject: "",
    emailIntro: "",
    sendAt: "",
    sentAt: "",
    insights: "",
    insightsAt: "",
    Event: undefined,
  };
  const [questions, setQuestions] = React.useState(initialValues.questions);
  const [active, setActive] = React.useState(initialValues.active);
  const [emailSubject, setEmailSubject] = React.useState(
    initialValues.emailSubject
  );
  const [emailIntro, setEmailIntro] = React.useState(initialValues.emailIntro);
  const [sendAt, setSendAt] = React.useState(initialValues.sendAt);
  const [sentAt, setSentAt] = React.useState(initialValues.sentAt);
  const [insights, setInsights] = React.useState(initialValues.insights);
  const [insightsAt, setInsightsAt] = React.useState(initialValues.insightsAt);
  const [Event, setEvent] = React.useState(initialValues.Event);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = surveyRecord
      ? { ...initialValues, ...surveyRecord, Event }
      : initialValues;
    setQuestions(
      typeof cleanValues.questions === "string" ||
        cleanValues.questions === null
        ? cleanValues.questions
        : JSON.stringify(cleanValues.questions)
    );
    setActive(cleanValues.active);
    setEmailSubject(cleanValues.emailSubject);
    setEmailIntro(cleanValues.emailIntro);
    setSendAt(cleanValues.sendAt);
    setSentAt(cleanValues.sentAt);
    setInsights(
      typeof cleanValues.insights === "string" || cleanValues.insights === null
        ? cleanValues.insights
        : JSON.stringify(cleanValues.insights)
    );
    setInsightsAt(cleanValues.insightsAt);
    setEvent(cleanValues.Event);
    setCurrentEventValue(undefined);
    setCurrentEventDisplayValue("");
    setErrors({});
  };
  const [surveyRecord, setSurveyRecord] = React.useState(surveyModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Survey, idProp)
        : surveyModelProp;
      setSurveyRecord(record);
      const EventRecord = record ? await record.Event : undefined;
      setEvent(EventRecord);
    };
    queryData();
  }, [idProp, surveyModelProp]);
  React.useEffect(resetStateValues, [surveyRecord, Event]);
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
    active: [],
    emailSubject: [],
    emailIntro: [],
    sendAt: [],
    sentAt: [],
    insights: [{ type: "JSON" }],
    insightsAt: [],
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
          questions,
          active,
          emailSubject,
          emailIntro,
          sendAt,
          sentAt,
          insights,
          insightsAt,
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
          const eventToUnlink = await surveyRecord.Event;
          if (eventToUnlink) {
            promises.push(
              DataStore.save(
                Event0.copyOf(eventToUnlink, (updated) => {
                  updated.Survey = undefined;
                  updated.eventSurveyId = undefined;
                })
              )
            );
          }
          const eventToLink = modelFields.Event;
          if (eventToLink) {
            promises.push(
              DataStore.save(
                Event0.copyOf(eventToLink, (updated) => {
                  updated.Survey = surveyRecord;
                })
              )
            );
            const surveyToUnlink = await eventToLink.Survey;
            if (surveyToUnlink) {
              promises.push(
                DataStore.save(
                  Survey.copyOf(surveyToUnlink, (updated) => {
                    updated.Event = undefined;
                    updated.surveyEventId = undefined;
                  })
                )
              );
            }
          }
          promises.push(
            DataStore.save(
              Survey.copyOf(surveyRecord, (updated) => {
                Object.assign(updated, modelFields);
                if (!modelFields.Event) {
                  updated.surveyEventId = undefined;
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
      {...getOverrideProps(overrides, "SurveyUpdateForm")}
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
              active,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt,
              insights,
              insightsAt,
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
      <SwitchField
        label="Active"
        defaultChecked={false}
        isDisabled={false}
        isChecked={active}
        onChange={(e) => {
          let value = e.target.checked;
          if (onChange) {
            const modelFields = {
              questions,
              active: value,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt,
              insights,
              insightsAt,
              Event,
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
        label="Email subject"
        isRequired={false}
        isReadOnly={false}
        value={emailSubject}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject: value,
              emailIntro,
              sendAt,
              sentAt,
              insights,
              insightsAt,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.emailSubject ?? value;
          }
          if (errors.emailSubject?.hasError) {
            runValidationTasks("emailSubject", value);
          }
          setEmailSubject(value);
        }}
        onBlur={() => runValidationTasks("emailSubject", emailSubject)}
        errorMessage={errors.emailSubject?.errorMessage}
        hasError={errors.emailSubject?.hasError}
        {...getOverrideProps(overrides, "emailSubject")}
      ></TextField>
      <TextField
        label="Email intro"
        isRequired={false}
        isReadOnly={false}
        value={emailIntro}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro: value,
              sendAt,
              sentAt,
              insights,
              insightsAt,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.emailIntro ?? value;
          }
          if (errors.emailIntro?.hasError) {
            runValidationTasks("emailIntro", value);
          }
          setEmailIntro(value);
        }}
        onBlur={() => runValidationTasks("emailIntro", emailIntro)}
        errorMessage={errors.emailIntro?.errorMessage}
        hasError={errors.emailIntro?.hasError}
        {...getOverrideProps(overrides, "emailIntro")}
      ></TextField>
      <TextField
        label="Send at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={sendAt && convertToLocal(new Date(sendAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro,
              sendAt: value,
              sentAt,
              insights,
              insightsAt,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.sendAt ?? value;
          }
          if (errors.sendAt?.hasError) {
            runValidationTasks("sendAt", value);
          }
          setSendAt(value);
        }}
        onBlur={() => runValidationTasks("sendAt", sendAt)}
        errorMessage={errors.sendAt?.errorMessage}
        hasError={errors.sendAt?.hasError}
        {...getOverrideProps(overrides, "sendAt")}
      ></TextField>
      <TextField
        label="Sent at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={sentAt && convertToLocal(new Date(sentAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt: value,
              insights,
              insightsAt,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.sentAt ?? value;
          }
          if (errors.sentAt?.hasError) {
            runValidationTasks("sentAt", value);
          }
          setSentAt(value);
        }}
        onBlur={() => runValidationTasks("sentAt", sentAt)}
        errorMessage={errors.sentAt?.errorMessage}
        hasError={errors.sentAt?.hasError}
        {...getOverrideProps(overrides, "sentAt")}
      ></TextField>
      <TextAreaField
        label="Insights"
        isRequired={false}
        isReadOnly={false}
        value={insights}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt,
              insights: value,
              insightsAt,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.insights ?? value;
          }
          if (errors.insights?.hasError) {
            runValidationTasks("insights", value);
          }
          setInsights(value);
        }}
        onBlur={() => runValidationTasks("insights", insights)}
        errorMessage={errors.insights?.errorMessage}
        hasError={errors.insights?.hasError}
        {...getOverrideProps(overrides, "insights")}
      ></TextAreaField>
      <TextField
        label="Insights at"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={insightsAt && convertToLocal(new Date(insightsAt))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt,
              insights,
              insightsAt: value,
              Event,
            };
            const result = onChange(modelFields);
            value = result?.insightsAt ?? value;
          }
          if (errors.insightsAt?.hasError) {
            runValidationTasks("insightsAt", value);
          }
          setInsightsAt(value);
        }}
        onBlur={() => runValidationTasks("insightsAt", insightsAt)}
        errorMessage={errors.insightsAt?.errorMessage}
        hasError={errors.insightsAt?.hasError}
        {...getOverrideProps(overrides, "insightsAt")}
      ></TextField>
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              questions,
              active,
              emailSubject,
              emailIntro,
              sendAt,
              sentAt,
              insights,
              insightsAt,
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
          isDisabled={!(idProp || surveyModelProp)}
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
              !(idProp || surveyModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
