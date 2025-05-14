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
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { Area, Career, Campus } from "../models";
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
export default function AreaUpdateForm(props) {
  const {
    id: idProp,
    area: areaModelProp,
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
    campusID: undefined,
    Carreras: [],
  };
  const [title, setTitle] = React.useState(initialValues.title);
  const [description, setDescription] = React.useState(
    initialValues.description
  );
  const [costCenter, setCostCenter] = React.useState(initialValues.costCenter);
  const [campusID, setCampusID] = React.useState(initialValues.campusID);
  const [Carreras, setCarreras] = React.useState(initialValues.Carreras);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = areaRecord
      ? { ...initialValues, ...areaRecord, campusID, Carreras: linkedCarreras }
      : initialValues;
    setTitle(cleanValues.title);
    setDescription(cleanValues.description);
    setCostCenter(cleanValues.costCenter);
    setCampusID(cleanValues.campusID);
    setCurrentCampusIDValue(undefined);
    setCurrentCampusIDDisplayValue("");
    setCarreras(cleanValues.Carreras ?? []);
    setCurrentCarrerasValue(undefined);
    setCurrentCarrerasDisplayValue("");
    setErrors({});
  };
  const [areaRecord, setAreaRecord] = React.useState(areaModelProp);
  const [linkedCarreras, setLinkedCarreras] = React.useState([]);
  const canUnlinkCarreras = false;
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Area, idProp)
        : areaModelProp;
      setAreaRecord(record);
      const campusIDRecord = record ? await record.campusID : undefined;
      setCampusID(campusIDRecord);
      const linkedCarreras =
        (record && (await record.Carreras?.toArray())) || [];
      setLinkedCarreras(linkedCarreras);
    };
    queryData();
  }, [idProp, areaModelProp]);
  React.useEffect(resetStateValues, [areaRecord, campusID, linkedCarreras]);
  const [currentCampusIDDisplayValue, setCurrentCampusIDDisplayValue] =
    React.useState("");
  const [currentCampusIDValue, setCurrentCampusIDValue] =
    React.useState(undefined);
  const campusIDRef = React.createRef();
  const [currentCarrerasDisplayValue, setCurrentCarrerasDisplayValue] =
    React.useState("");
  const [currentCarrerasValue, setCurrentCarrerasValue] =
    React.useState(undefined);
  const CarrerasRef = React.createRef();
  const getIDValue = {
    Carreras: (r) => JSON.stringify({ id: r?.id }),
  };
  const CarrerasIdSet = new Set(
    Array.isArray(Carreras)
      ? Carreras.map((r) => getIDValue.Carreras?.(r))
      : getIDValue.Carreras?.(Carreras)
  );
  const campusRecords = useDataStoreBinding({
    type: "collection",
    model: Campus,
  }).items;
  const careerRecords = useDataStoreBinding({
    type: "collection",
    model: Career,
  }).items;
  const getDisplayValue = {
    campusID: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
    Carreras: (r) => `${r?.title ? r?.title + " - " : ""}${r?.id}`,
  };
  const validations = {
    title: [],
    description: [],
    costCenter: [],
    campusID: [{ type: "Required" }],
    Carreras: [],
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
          campusID,
          Carreras,
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
          const carrerasToLink = [];
          const carrerasToUnLink = [];
          const carrerasSet = new Set();
          const linkedCarrerasSet = new Set();
          Carreras.forEach((r) => carrerasSet.add(getIDValue.Carreras?.(r)));
          linkedCarreras.forEach((r) =>
            linkedCarrerasSet.add(getIDValue.Carreras?.(r))
          );
          linkedCarreras.forEach((r) => {
            if (!carrerasSet.has(getIDValue.Carreras?.(r))) {
              carrerasToUnLink.push(r);
            }
          });
          Carreras.forEach((r) => {
            if (!linkedCarrerasSet.has(getIDValue.Carreras?.(r))) {
              carrerasToLink.push(r);
            }
          });
          carrerasToUnLink.forEach((original) => {
            if (!canUnlinkCarreras) {
              throw Error(
                `Career ${original.id} cannot be unlinked from Area because areaID is a required field.`
              );
            }
            promises.push(
              DataStore.save(
                Career.copyOf(original, (updated) => {
                  updated.areaID = null;
                })
              )
            );
          });
          carrerasToLink.forEach((original) => {
            promises.push(
              DataStore.save(
                Career.copyOf(original, (updated) => {
                  updated.areaID = areaRecord.id;
                })
              )
            );
          });
          const modelFieldsToSave = {
            title: modelFields.title,
            description: modelFields.description,
            costCenter: modelFields.costCenter,
            campusID: modelFields.campusID,
          };
          promises.push(
            DataStore.save(
              Area.copyOf(areaRecord, (updated) => {
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
      {...getOverrideProps(overrides, "AreaUpdateForm")}
      {...rest}
    >
      <TextField
        label="Indica a los usuarios que área organiza los eventos"
        isRequired={false}
        isReadOnly={false}
        placeholder="Nombre área"
        value={title}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title: value,
              description,
              costCenter,
              campusID,
              Carreras,
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
      <TextAreaField
        label="Descripción del área"
        isRequired={false}
        isReadOnly={false}
        placeholder="A qué tipo de eventos se dedica el área?"
        value={description}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description: value,
              costCenter,
              campusID,
              Carreras,
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
      ></TextAreaField>
      <TextField
        label="Centro de costos"
        isRequired={false}
        isReadOnly={false}
        value={costCenter}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              title,
              description,
              costCenter: value,
              campusID,
              Carreras,
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
              campusID: value,
              Carreras,
            };
            const result = onChange(modelFields);
            value = result?.campusID ?? value;
          }
          setCampusID(value);
          setCurrentCampusIDValue(undefined);
        }}
        currentFieldValue={currentCampusIDValue}
        label={"Campus"}
        items={campusID ? [campusID] : []}
        hasError={errors?.campusID?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("campusID", currentCampusIDValue)
        }
        errorMessage={errors?.campusID?.errorMessage}
        getBadgeText={(value) =>
          value
            ? getDisplayValue.campusID(
                campusRecords.find((r) => r.id === value)
              )
            : ""
        }
        setFieldValue={(value) => {
          setCurrentCampusIDDisplayValue(
            value
              ? getDisplayValue.campusID(
                  campusRecords.find((r) => r.id === value)
                )
              : ""
          );
          setCurrentCampusIDValue(value);
        }}
        inputFieldRef={campusIDRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Campus"
          isRequired={true}
          isReadOnly={false}
          placeholder="Buscar Campus"
          value={currentCampusIDDisplayValue}
          options={campusRecords
            .filter(
              (r, i, arr) =>
                arr.findIndex((member) => member?.id === r?.id) === i
            )
            .map((r) => ({
              id: r?.id,
              label: getDisplayValue.campusID?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentCampusIDValue(id);
            setCurrentCampusIDDisplayValue(label);
            runValidationTasks("campusID", label);
          }}
          onClear={() => {
            setCurrentCampusIDDisplayValue("");
          }}
          defaultValue={campusID}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.campusID?.hasError) {
              runValidationTasks("campusID", value);
            }
            setCurrentCampusIDDisplayValue(value);
            setCurrentCampusIDValue(undefined);
          }}
          onBlur={() => runValidationTasks("campusID", currentCampusIDValue)}
          errorMessage={errors.campusID?.errorMessage}
          hasError={errors.campusID?.hasError}
          ref={campusIDRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "campusID")}
        ></Autocomplete>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              title,
              description,
              costCenter,
              campusID,
              Carreras: values,
            };
            const result = onChange(modelFields);
            values = result?.Carreras ?? values;
          }
          setCarreras(values);
          setCurrentCarrerasValue(undefined);
          setCurrentCarrerasDisplayValue("");
        }}
        currentFieldValue={currentCarrerasValue}
        label={"Subareas"}
        items={Carreras}
        hasError={errors?.Carreras?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("Carreras", currentCarrerasValue)
        }
        errorMessage={errors?.Carreras?.errorMessage}
        getBadgeText={getDisplayValue.Carreras}
        setFieldValue={(model) => {
          setCurrentCarrerasDisplayValue(
            model ? getDisplayValue.Carreras(model) : ""
          );
          setCurrentCarrerasValue(model);
        }}
        inputFieldRef={CarrerasRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Subareas"
          isRequired={false}
          isReadOnly={false}
          placeholder="Buscar Subareas"
          value={currentCarrerasDisplayValue}
          options={careerRecords
            .filter((r) => !CarrerasIdSet.has(getIDValue.Carreras?.(r)))
            .map((r) => ({
              id: getIDValue.Carreras?.(r),
              label: getDisplayValue.Carreras?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentCarrerasValue(
              careerRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentCarrerasDisplayValue(label);
            runValidationTasks("Carreras", label);
          }}
          onClear={() => {
            setCurrentCarrerasDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.Carreras?.hasError) {
              runValidationTasks("Carreras", value);
            }
            setCurrentCarrerasDisplayValue(value);
            setCurrentCarrerasValue(undefined);
          }}
          onBlur={() =>
            runValidationTasks("Carreras", currentCarrerasDisplayValue)
          }
          errorMessage={errors.Carreras?.errorMessage}
          hasError={errors.Carreras?.hasError}
          ref={CarrerasRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "Carreras")}
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
              !(idProp || areaModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
