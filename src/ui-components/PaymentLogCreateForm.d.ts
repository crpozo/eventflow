/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type PaymentLogCreateFormInputValues = {
    eventattendeeID?: string;
    status?: string;
};
export declare type PaymentLogCreateFormValidationValues = {
    eventattendeeID?: ValidationFunction<string>;
    status?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type PaymentLogCreateFormOverridesProps = {
    PaymentLogCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventattendeeID?: PrimitiveOverrideProps<AutocompleteProps>;
    status?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type PaymentLogCreateFormProps = React.PropsWithChildren<{
    overrides?: PaymentLogCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: PaymentLogCreateFormInputValues) => PaymentLogCreateFormInputValues;
    onSuccess?: (fields: PaymentLogCreateFormInputValues) => void;
    onError?: (fields: PaymentLogCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: PaymentLogCreateFormInputValues) => PaymentLogCreateFormInputValues;
    onValidate?: PaymentLogCreateFormValidationValues;
} & React.CSSProperties>;
export default function PaymentLogCreateForm(props: PaymentLogCreateFormProps): React.ReactElement;
