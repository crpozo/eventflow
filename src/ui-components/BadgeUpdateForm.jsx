/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { Badge as Badge0 } from "../models";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { DataStore } from "aws-amplify/datastore";
export default function BadgeUpdateForm(props) {
  const {
    id: idProp,
    badge: badgeModelProp,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    frontDesign: "",
    backDesign: "",
  };
  const [frontDesign, setFrontDesign] = React.useState(
    initialValues.frontDesign
  );
  const [backDesign, setBackDesign] = React.useState(initialValues.backDesign);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = badgeRecord
      ? { ...initialValues, ...badgeRecord }
      : initialValues;
    setFrontDesign(cleanValues.frontDesign);
    setBackDesign(cleanValues.backDesign);
    setErrors({});
  };
  const [badgeRecord, setBadgeRecord] = React.useState(badgeModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Badge0, idProp)
        : badgeModelProp;
      setBadgeRecord(record);
    };
    queryData();
  }, [idProp, badgeModelProp]);
  React.useEffect(resetStateValues, [badgeRecord]);
  const validations = {
    frontDesign: [],
    backDesign: [],
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
          frontDesign,
          backDesign,
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
            Badge0.copyOf(badgeRecord, (updated) => {
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
      {...getOverrideProps(overrides, "BadgeUpdateForm")}
      {...rest}
    >
      <TextField
        label="Front design"
        isRequired={false}
        isReadOnly={false}
        value={frontDesign}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              frontDesign: value,
              backDesign,
            };
            const result = onChange(modelFields);
            value = result?.frontDesign ?? value;
          }
          if (errors.frontDesign?.hasError) {
            runValidationTasks("frontDesign", value);
          }
          setFrontDesign(value);
        }}
        onBlur={() => runValidationTasks("frontDesign", frontDesign)}
        errorMessage={errors.frontDesign?.errorMessage}
        hasError={errors.frontDesign?.hasError}
        {...getOverrideProps(overrides, "frontDesign")}
      ></TextField>
      <TextField
        label="Back design"
        isRequired={false}
        isReadOnly={false}
        value={backDesign}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              frontDesign,
              backDesign: value,
            };
            const result = onChange(modelFields);
            value = result?.backDesign ?? value;
          }
          if (errors.backDesign?.hasError) {
            runValidationTasks("backDesign", value);
          }
          setBackDesign(value);
        }}
        onBlur={() => runValidationTasks("backDesign", backDesign)}
        errorMessage={errors.backDesign?.errorMessage}
        hasError={errors.backDesign?.hasError}
        {...getOverrideProps(overrides, "backDesign")}
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
          isDisabled={!(idProp || badgeModelProp)}
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
              !(idProp || badgeModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
