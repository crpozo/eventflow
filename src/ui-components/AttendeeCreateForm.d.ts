/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type AttendeeCreateFormInputValues = {
    name?: string;
    type?: string;
    age?: string;
    position?: string;
};
export declare type AttendeeCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    age?: ValidationFunction<string>;
    position?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AttendeeCreateFormOverridesProps = {
    AttendeeCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<TextFieldProps>;
    age?: PrimitiveOverrideProps<TextFieldProps>;
    position?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type AttendeeCreateFormProps = React.PropsWithChildren<{
    overrides?: AttendeeCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AttendeeCreateFormInputValues) => AttendeeCreateFormInputValues;
    onSuccess?: (fields: AttendeeCreateFormInputValues) => void;
    onError?: (fields: AttendeeCreateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: AttendeeCreateFormInputValues) => AttendeeCreateFormInputValues;
    onValidate?: AttendeeCreateFormValidationValues;
} & React.CSSProperties>;
export default function AttendeeCreateForm(props: AttendeeCreateFormProps): React.ReactElement;
