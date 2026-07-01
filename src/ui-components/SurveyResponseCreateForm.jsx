/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  TextAreaField,
  TextField,
} from "@aws-amplify/ui-react";
import { SurveyResponse } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function SurveyResponseCreateForm(props) {
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
    surveyID: "",
    eventID: "",
    token: "",
    answers: "",
  };
  const [surveyID, setSurveyID] = React.useState(initialValues.surveyID);
  const [eventID, setEventID] = React.useState(initialValues.eventID);
  const [token, setToken] = React.useState(initialValues.token);
  const [answers, setAnswers] = React.useState(initialValues.answers);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setSurveyID(initialValues.surveyID);
    setEventID(initialValues.eventID);
    setToken(initialValues.token);
    setAnswers(initialValues.answers);
    setErrors({});
  };
  const validations = {
    surveyID: [{ type: "Required" }],
    eventID: [{ type: "Required" }],
    token: [],
    answers: [{ type: "JSON" }],
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
          surveyID,
          eventID,
          token,
          answers,
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
          await DataStore.save(new SurveyResponse(modelFields));
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
      {...getOverrideProps(overrides, "SurveyResponseCreateForm")}
      {...rest}
    >
      <TextField
        label="Survey id"
        isRequired={true}
        isReadOnly={false}
        value={surveyID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              surveyID: value,
              eventID,
              token,
              answers,
            };
            const result = onChange(modelFields);
            value = result?.surveyID ?? value;
          }
          if (errors.surveyID?.hasError) {
            runValidationTasks("surveyID", value);
          }
          setSurveyID(value);
        }}
        onBlur={() => runValidationTasks("surveyID", surveyID)}
        errorMessage={errors.surveyID?.errorMessage}
        hasError={errors.surveyID?.hasError}
        {...getOverrideProps(overrides, "surveyID")}
      ></TextField>
      <TextField
        label="Event id"
        isRequired={true}
        isReadOnly={false}
        value={eventID}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              surveyID,
              eventID: value,
              token,
              answers,
            };
            const result = onChange(modelFields);
            value = result?.eventID ?? value;
          }
          if (errors.eventID?.hasError) {
            runValidationTasks("eventID", value);
          }
          setEventID(value);
        }}
        onBlur={() => runValidationTasks("eventID", eventID)}
        errorMessage={errors.eventID?.errorMessage}
        hasError={errors.eventID?.hasError}
        {...getOverrideProps(overrides, "eventID")}
      ></TextField>
      <TextField
        label="Token"
        isRequired={false}
        isReadOnly={false}
        value={token}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              surveyID,
              eventID,
              token: value,
              answers,
            };
            const result = onChange(modelFields);
            value = result?.token ?? value;
          }
          if (errors.token?.hasError) {
            runValidationTasks("token", value);
          }
          setToken(value);
        }}
        onBlur={() => runValidationTasks("token", token)}
        errorMessage={errors.token?.errorMessage}
        hasError={errors.token?.hasError}
        {...getOverrideProps(overrides, "token")}
      ></TextField>
      <TextAreaField
        label="Answers"
        isRequired={false}
        isReadOnly={false}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              surveyID,
              eventID,
              token,
              answers: value,
            };
            const result = onChange(modelFields);
            value = result?.answers ?? value;
          }
          if (errors.answers?.hasError) {
            runValidationTasks("answers", value);
          }
          setAnswers(value);
        }}
        onBlur={() => runValidationTasks("answers", answers)}
        errorMessage={errors.answers?.errorMessage}
        hasError={errors.answers?.hasError}
        {...getOverrideProps(overrides, "answers")}
      ></TextAreaField>
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
