/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SelectFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Badge as Badge0 } from "../models";
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
export declare type EventCreateFormInputValues = {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    date?: string;
    contactName?: string[];
    contactNumber?: number[];
    termsCondition?: string;
    careerID?: string;
    eventIdUSFQ?: string;
    periodoUSFQ?: string;
    usuarioUSFQ?: string;
    Badge?: Badge0;
};
export declare type EventCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    location?: ValidationFunction<string>;
    date?: ValidationFunction<string>;
    contactName?: ValidationFunction<string>;
    contactNumber?: ValidationFunction<number>;
    termsCondition?: ValidationFunction<string>;
    careerID?: ValidationFunction<string>;
    eventIdUSFQ?: ValidationFunction<string>;
    periodoUSFQ?: ValidationFunction<string>;
    usuarioUSFQ?: ValidationFunction<string>;
    Badge?: ValidationFunction<Badge0>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventCreateFormOverridesProps = {
    EventCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextAreaFieldProps>;
    category?: PrimitiveOverrideProps<TextFieldProps>;
    location?: PrimitiveOverrideProps<SelectFieldProps>;
    date?: PrimitiveOverrideProps<TextFieldProps>;
    contactName?: PrimitiveOverrideProps<TextFieldProps>;
    contactNumber?: PrimitiveOverrideProps<TextFieldProps>;
    termsCondition?: PrimitiveOverrideProps<TextAreaFieldProps>;
    careerID?: PrimitiveOverrideProps<AutocompleteProps>;
    eventIdUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    periodoUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    usuarioUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    Badge?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type EventCreateFormProps = React.PropsWithChildren<{
    overrides?: EventCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: EventCreateFormInputValues) => EventCreateFormInputValues;
    onSuccess?: (fields: EventCreateFormInputValues) => void;
    onError?: (fields: EventCreateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: EventCreateFormInputValues) => EventCreateFormInputValues;
    onValidate?: EventCreateFormValidationValues;
} & React.CSSProperties>;
export default function EventCreateForm(props: EventCreateFormProps): React.ReactElement;
