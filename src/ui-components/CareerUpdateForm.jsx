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
import { Career, Area } from "../models";
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
export default function CareerUpdateForm(props) {
  const {
    id: idProp,
    career: careerModelProp,
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
    costCenter: "",
    areaID: undefined,
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [costCenter, setCostCenter] = React.useState(initialValues.costCenter);
  const [areaID, setAreaID] = React.useState(initialValues.areaID);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = careerRecord
      ? { ...initialValues, ...careerRecord, areaID }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setCostCenter(cleanValues.costCenter);
    setAreaID(cleanValues.areaID);
    setCurrentAreaIDValue(undefined);
    setCurrentAreaIDDisplayValue("");
    setErrors({});
  };
  const [careerRecord, setCareerRecord] = React.useState(careerModelProp);
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Career, idProp)
        : careerModelProp;
      setCareerRecord(record);
      const areaIDRecord = record ? await record.areaID : undefined;
      setAreaID(areaIDRecord);
    };
    queryData();
  }, [idProp, careerModelProp]);
  React.useEffect(resetStateValues, [careerRecord, areaID]);
  const [currentAreaIDDisplayValue, setCurrentAreaIDDisplayValue] =
    React.useState("");
  const [currentAreaIDValue, setCurrentAreaIDValue] = React.useState(undefined);
  const areaIDRef = React.createRef();
  const areaRecords = useDataStoreBinding({
    type: "collection",
    model: Area,
  }).items;
  const getDisplayValue = {
    areaID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [],
    description: [],
    costCenter: [],
    areaID: [{ type: "Required" }],
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
          costCenter,
          areaID,
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
            Career.copyOf(careerRecord, (updated) => {
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
      {...getOverrideProps(overrides, "CareerUpdateForm")}
      {...rest}
    >
      <TextField
        label="Indica a los usuarios que subárea organiza los eventos"
        isRequired={false}
        isReadOnly={false}
        placeholder="Nombre subárea"
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              costCenter,
              areaID,
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
        label="Descripción de la carrera"
        isRequired={false}
        isReadOnly={false}
        placeholder="A qué tipo de eventos se dedica la carrera?"
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description: value,
              costCenter,
              areaID,
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
      <TextField
        label="Centro de costos"
        isRequired={false}
        isReadOnly={false}
        placeholder="Centro de costos"
        value={costCenter}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              costCenter: value,
              areaID,
            };
            const result = onChange(modelFields);
            value = result?.costCenter ?? value;
          }
          if (errors.costCenter?.hasError) {
            runValidationTasks("costCenter", value);
          }
          setCostCenter(value);
        }}
        onBlur={() => runValidationTasks("costCenter", costCenter)}
        errorMessage={errors.costCenter?.errorMessage}
        hasError={errors.costCenter?.hasError}
        {...getOverrideProps(overrides, "costCenter")}
      ></TextField>
      <ArrayField
        lengthLimit={1}
        onChange={async (items) => {
          let value = items[0];
          if (onChange) {
            const modelFields = {
              title,
              description,
              costCenter,
              areaID: value,
            };
            const result = onChange(modelFields);
            value = result?.areaID ?? value;
          }
          setAreaID(value);
          setCurrentAreaIDValue(undefined);
        }}
        currentFieldValue={currentAreaIDValue}
        label={"Area"}
        items={areaID ? [areaID] : []}
        hasError={errors?.areaID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("areaID", currentAreaIDValue)
        }
        errorMessage={errors?.areaID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.areaID(areaRecords.find((r) => r.id === value))
            : ""
        }
        setFieldValue={(value) => {
          setCurrentAreaIDDisplayValue(
            value
              ? getDisplayValue.areaID(areaRecords.find((r) => r.id === value))
              : ""
          );
          setCurrentAreaIDValue(value);
        }}
        inputFieldRef={areaIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Area"
          isRequired={true}
          isReadOnly={false}
          placeholder="Buscar Area"
          value={currentAreaIDDisplayValue}
          options={areaRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.areaID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentAreaIDValue(id);
            setCurrentAreaIDDisplayValue(label);
            runValidationTasks("areaID", label);
          }}
          onClear={() => {
            setCurrentAreaIDDisplayValue("");
          }}
          defaultValue={areaID}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.areaID?.hasError) {
              runValidationTasks("areaID", value);
            }
            setCurrentAreaIDDisplayValue(value);
            setCurrentAreaIDValue(undefined);
          }}
          onBlur={() => runValidationTasks("areaID", currentAreaIDValue)}
          errorMessage={errors.areaID?.errorMessage}
          hasError={errors.areaID?.hasError}
          ref={areaIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "areaID")}
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
              !(idProp || careerModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
