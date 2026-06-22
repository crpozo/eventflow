/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EventPermission } from "../models";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type EventPermissionUpdateFormInputValues = {
    userID?: string;
    eventID?: string;
    capabilities?: string[];
};
export declare type EventPermissionUpdateFormValidationValues = {
    userID?: ValidationFunction<string>;
    eventID?: ValidationFunction<string>;
    capabilities?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventPermissionUpdateFormOverridesProps = {
    EventPermissionUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    userID?: PrimitiveOverrideProps<TextFieldProps>;
    eventID?: PrimitiveOverrideProps<TextFieldProps>;
    capabilities?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type EventPermissionUpdateFormProps = React.PropsWithChildren<{
    overrides?: EventPermissionUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    eventPermission?: EventPermission;
    onSubmit?: (fields: EventPermissionUpdateFormInputValues) => EventPermissionUpdateFormInputValues;
    onSuccess?: (fields: EventPermissionUpdateFormInputValues) => void;
    onError?: (fields: EventPermissionUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: EventPermissionUpdateFormInputValues) => EventPermissionUpdateFormInputValues;
    onValidate?: EventPermissionUpdateFormValidationValues;
} & React.CSSProperties>;
export default function EventPermissionUpdateForm(props: EventPermissionUpdateFormProps): React.ReactElement;
