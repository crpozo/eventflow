/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import { Button, Flex, Grid, TextField } from "@aws-amplify/ui-react";
import { getOverrideProps } from "@aws-amplify/ui-react/internal";
import { fetchByPath, validateField } from "./utils";
export default function NewForm1(props) {
  const { onSubmit, onValidate, onChange, overrides, ...rest } = props;
  const initialValues = {
    Field1: "",
    Field2: "",
  };
  const [Field1, setField1] = React.useState(initialValues.Field1);
  const [Field2, setField2] = React.useState(initialValues.Field2);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setField1(initialValues.Field1);
    setField2(initialValues.Field2);
    setErrors({});
  };
  const validations = {
    Field1: [],
    Field2: [],
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
        const modelFields = {
          Field1,
          Field2,
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
        await onSubmit(modelFields);
      }}
      {...getOverrideProps(overrides, "NewForm1")}
      {...rest}
    >
      <Grid
        columnGap="inherit"
        rowGap="inherit"
        templateColumns="repeat(2, auto)"
        {...getOverrideProps(overrides, "RowGrid0")}
      >
        <TextField
          label="Ticket"
          value={Field1}
          onChange={(e) => {
            let { value } = e.target;
            if (onChange) {
              const modelFields = {
                Field1: value,
                Field2,
              };
              const result = onChange(modelFields);
              value = result?.Field1 ?? value;
            }
            if (errors.Field1?.hasError) {
              runValidationTasks("Field1", value);
            }
            setField1(value);
          }}
          onBlur={() => runValidationTasks("Field1", Field1)}
          errorMessage={errors.Field1?.errorMessage}
          hasError={errors.Field1?.hasError}
          {...getOverrideProps(overrides, "Field1")}
        ></TextField>
        <TextField
          label="Price"
          descriptiveText=""
          type="number"
          step="any"
          value={Field2}
          onChange={(e) => {
            let { value } = e.target;
            if (onChange) {
              const modelFields = {
                Field1,
                Field2: value,
              };
              const result = onChange(modelFields);
              value = result?.Field2 ?? value;
            }
            if (errors.Field2?.hasError) {
              runValidationTasks("Field2", value);
            }
            setField2(value);
          }}
          onBlur={() => runValidationTasks("Field2", Field2)}
          errorMessage={errors.Field2?.errorMessage}
          hasError={errors.Field2?.hasError}
          {...getOverrideProps(overrides, "Field2")}
        ></TextField>
      </Grid>
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
