/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SelectFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Event, Badge as Badge0 } from "../models";
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
export declare type EventUpdateFormInputValues = {
    title?: string;
    description?: string;
    category?: string;
    location?: string;
    date?: string;
    contactName?: string[];
    contactNumber?: number[];
    termsCondition?: string;
    eventIdUSFQ?: string;
    periodoUSFQ?: string;
    usuarioUSFQ?: string;
    Badge?: Badge0;
};
export declare type EventUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    category?: ValidationFunction<string>;
    location?: ValidationFunction<string>;
    date?: ValidationFunction<string>;
    contactName?: ValidationFunction<string>;
    contactNumber?: ValidationFunction<number>;
    termsCondition?: ValidationFunction<string>;
    eventIdUSFQ?: ValidationFunction<string>;
    periodoUSFQ?: ValidationFunction<string>;
    usuarioUSFQ?: ValidationFunction<string>;
    Badge?: ValidationFunction<Badge0>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventUpdateFormOverridesProps = {
    EventUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    category?: PrimitiveOverrideProps<TextFieldProps>;
    location?: PrimitiveOverrideProps<SelectFieldProps>;
    date?: PrimitiveOverrideProps<TextFieldProps>;
    contactName?: PrimitiveOverrideProps<TextFieldProps>;
    contactNumber?: PrimitiveOverrideProps<TextFieldProps>;
    termsCondition?: PrimitiveOverrideProps<TextFieldProps>;
    eventIdUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    periodoUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    usuarioUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    Badge?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type EventUpdateFormProps = React.PropsWithChildren<{
    overrides?: EventUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    event?: Event;
    onSubmit?: (fields: EventUpdateFormInputValues) => EventUpdateFormInputValues;
    onSuccess?: (fields: EventUpdateFormInputValues) => void;
    onError?: (fields: EventUpdateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: EventUpdateFormInputValues) => EventUpdateFormInputValues;
    onValidate?: EventUpdateFormValidationValues;
} & React.CSSProperties>;
export default function EventUpdateForm(props: EventUpdateFormProps): React.ReactElement;
