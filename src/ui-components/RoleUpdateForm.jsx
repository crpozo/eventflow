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
import { Role, User } from "../models";
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
export default function RoleUpdateForm(props) {
  const {
    id: idProp,
    role: roleModelProp,
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
    areas: [],
    users: [],
  };
  const [name, setName] = React.useState(initialValues.name);
  const [areas, setAreas] = React.useState(initialValues.areas);
  const [users, setUsers] = React.useState(initialValues.users);
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    const cleanValues = roleRecord
      ? { ...initialValues, ...roleRecord, users: linkedUsers }
      : initialValues;
    setName(cleanValues.name);
    setAreas(cleanValues.areas ?? []);
    setCurrentAreasValue("");
    setUsers(cleanValues.users ?? []);
    setCurrentUsersValue(undefined);
    setCurrentUsersDisplayValue("");
    setErrors({});
  };
  const [roleRecord, setRoleRecord] = React.useState(roleModelProp);
  const [linkedUsers, setLinkedUsers] = React.useState([]);
  const canUnlinkUsers = true;
  React.useEffect(() => {
    const queryData = async () => {
      const record = idProp
        ? await DataStore.query(Role, idProp)
        : roleModelProp;
      setRoleRecord(record);
      const linkedUsers = (record && (await record.users?.toArray())) || [];
      setLinkedUsers(linkedUsers);
    };
    queryData();
  }, [idProp, roleModelProp]);
  React.useEffect(resetStateValues, [roleRecord, linkedUsers]);
  const [currentAreasValue, setCurrentAreasValue] = React.useState("");
  const areasRef = React.createRef();
  const [currentUsersDisplayValue, setCurrentUsersDisplayValue] =
    React.useState("");
  const [currentUsersValue, setCurrentUsersValue] = React.useState(undefined);
  const usersRef = React.createRef();
  const getIDValue = {
    users: (r) => JSON.stringify({ id: r?.id }),
  };
  const usersIdSet = new Set(
    Array.isArray(users)
      ? users.map((r) => getIDValue.users?.(r))
      : getIDValue.users?.(users)
  );
  const userRecords = useDataStoreBinding({
    type: "collection",
    model: User,
  }).items;
  const getDisplayValue = {
    users: (r) => `${r?.email ? r?.email + " - " : ""}${r?.id}`,
  };
  const validations = {
    name: [{ type: "Required" }],
    areas: [],
    users: [],
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
          areas,
          users,
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
          const usersToLink = [];
          const usersToUnLink = [];
          const usersSet = new Set();
          const linkedUsersSet = new Set();
          users.forEach((r) => usersSet.add(getIDValue.users?.(r)));
          linkedUsers.forEach((r) => linkedUsersSet.add(getIDValue.users?.(r)));
          linkedUsers.forEach((r) => {
            if (!usersSet.has(getIDValue.users?.(r))) {
              usersToUnLink.push(r);
            }
          });
          users.forEach((r) => {
            if (!linkedUsersSet.has(getIDValue.users?.(r))) {
              usersToLink.push(r);
            }
          });
          usersToUnLink.forEach((original) => {
            if (!canUnlinkUsers) {
              throw Error(
                `User ${original.id} cannot be unlinked from Role because undefined is a required field.`
              );
            }
            promises.push(
              DataStore.save(
                User.copyOf(original, (updated) => {
                  updated.role = null;
                })
              )
            );
          });
          usersToLink.forEach((original) => {
            promises.push(
              DataStore.save(
                User.copyOf(original, (updated) => {
                  updated.role = roleRecord;
                })
              )
            );
          });
          const modelFieldsToSave = {
            name: modelFields.name,
            areas: modelFields.areas,
          };
          promises.push(
            DataStore.save(
              Role.copyOf(roleRecord, (updated) => {
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
      {...getOverrideProps(overrides, "RoleUpdateForm")}
      {...rest}
    >
      <TextField
        label="Name"
        isRequired={true}
        isReadOnly={false}
        value={name}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              name: value,
              areas,
              users,
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
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              areas: values,
              users,
            };
            const result = onChange(modelFields);
            values = result?.areas ?? values;
          }
          setAreas(values);
          setCurrentAreasValue("");
        }}
        currentFieldValue={currentAreasValue}
        label={"Areas"}
        items={areas}
        hasError={errors?.areas?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("areas", currentAreasValue)
        }
        errorMessage={errors?.areas?.errorMessage}
        setFieldValue={setCurrentAreasValue}
        inputFieldRef={areasRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Areas"
          isRequired={false}
          isReadOnly={false}
          value={currentAreasValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.areas?.hasError) {
              runValidationTasks("areas", value);
            }
            setCurrentAreasValue(value);
          }}
          onBlur={() => runValidationTasks("areas", currentAreasValue)}
          errorMessage={errors.areas?.errorMessage}
          hasError={errors.areas?.hasError}
          ref={areasRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "areas")}
        ></TextField>
      </ArrayField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              name,
              areas,
              users: values,
            };
            const result = onChange(modelFields);
            values = result?.users ?? values;
          }
          setUsers(values);
          setCurrentUsersValue(undefined);
          setCurrentUsersDisplayValue("");
        }}
        currentFieldValue={currentUsersValue}
        label={"Users"}
        items={users}
        hasError={errors?.users?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks("users", currentUsersValue)
        }
        errorMessage={errors?.users?.errorMessage}
        getBadgeText={getDisplayValue.users}
        setFieldValue={(model) => {
          setCurrentUsersDisplayValue(
            model ? getDisplayValue.users(model) : ""
          );
          setCurrentUsersValue(model);
        }}
        inputFieldRef={usersRef}
        defaultFieldValue={""}
      >
        <Autocomplete
          label="Users"
          isRequired={false}
          isReadOnly={false}
          placeholder="Search User"
          value={currentUsersDisplayValue}
          options={userRecords
            .filter((r) => !usersIdSet.has(getIDValue.users?.(r)))
            .map((r) => ({
              id: getIDValue.users?.(r),
              label: getDisplayValue.users?.(r),
            }))}
          onSelect={({ id, label }) => {
            setCurrentUsersValue(
              userRecords.find((r) =>
                Object.entries(JSON.parse(id)).every(
                  ([key, value]) => r[key] === value
                )
              )
            );
            setCurrentUsersDisplayValue(label);
            runValidationTasks("users", label);
          }}
          onClear={() => {
            setCurrentUsersDisplayValue("");
          }}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.users?.hasError) {
              runValidationTasks("users", value);
            }
            setCurrentUsersDisplayValue(value);
            setCurrentUsersValue(undefined);
          }}
          onBlur={() => runValidationTasks("users", currentUsersDisplayValue)}
          errorMessage={errors.users?.errorMessage}
          hasError={errors.users?.hasError}
          ref={usersRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "users")}
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
          isDisabled={!(idProp || roleModelProp)}
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
              !(idProp || roleModelProp) ||
              Object.values(errors).some((e) => e?.hasError)
            }
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
