/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, HeadingProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
    date?: string;
    termsCondition?: string;
    maxRegs?: number;
    totalScannedTicket?: number;
    contactTemplate?: string;
    startDate?: string;
    endDate?: string;
    sendCertificates?: boolean;
    certificate?: string;
    certificatePosition?: string;
    certificatesSentAt?: string;
    careerID?: string;
    Badge?: Badge0;
    usuarioUSFQ?: string;
    periodoUSFQ?: string;
    eventIdUSFQ?: string;
};
export declare type EventCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    date?: ValidationFunction<string>;
    termsCondition?: ValidationFunction<string>;
    maxRegs?: ValidationFunction<number>;
    totalScannedTicket?: ValidationFunction<number>;
    contactTemplate?: ValidationFunction<string>;
    startDate?: ValidationFunction<string>;
    endDate?: ValidationFunction<string>;
    sendCertificates?: ValidationFunction<boolean>;
    certificate?: ValidationFunction<string>;
    certificatePosition?: ValidationFunction<string>;
    certificatesSentAt?: ValidationFunction<string>;
    careerID?: ValidationFunction<string>;
    Badge?: ValidationFunction<Badge0>;
    usuarioUSFQ?: ValidationFunction<string>;
    periodoUSFQ?: ValidationFunction<string>;
    eventIdUSFQ?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventCreateFormOverridesProps = {
    EventCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextAreaFieldProps>;
    date?: PrimitiveOverrideProps<TextFieldProps>;
    termsCondition?: PrimitiveOverrideProps<TextAreaFieldProps>;
    maxRegs?: PrimitiveOverrideProps<TextFieldProps>;
    totalScannedTicket?: PrimitiveOverrideProps<TextFieldProps>;
    contactTemplate?: PrimitiveOverrideProps<TextAreaFieldProps>;
    startDate?: PrimitiveOverrideProps<TextFieldProps>;
    endDate?: PrimitiveOverrideProps<TextFieldProps>;
    sendCertificates?: PrimitiveOverrideProps<SwitchFieldProps>;
    certificate?: PrimitiveOverrideProps<TextFieldProps>;
    certificatePosition?: PrimitiveOverrideProps<TextAreaFieldProps>;
    certificatesSentAt?: PrimitiveOverrideProps<TextFieldProps>;
    careerID?: PrimitiveOverrideProps<AutocompleteProps>;
    Badge?: PrimitiveOverrideProps<AutocompleteProps>;
    SectionalElement0?: PrimitiveOverrideProps<HeadingProps>;
    usuarioUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    periodoUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    eventIdUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
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
