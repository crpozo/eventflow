/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, HeadingProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
    Badge?: Badge0;
    usuarioUSFQ?: string;
    eventIdUSFQ?: string;
    periodoUSFQ?: string;
};
export declare type EventUpdateFormValidationValues = {
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
    Badge?: ValidationFunction<Badge0>;
    usuarioUSFQ?: ValidationFunction<string>;
    eventIdUSFQ?: ValidationFunction<string>;
    periodoUSFQ?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventUpdateFormOverridesProps = {
    EventUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextFieldProps>;
    date?: PrimitiveOverrideProps<TextFieldProps>;
    termsCondition?: PrimitiveOverrideProps<TextFieldProps>;
    maxRegs?: PrimitiveOverrideProps<TextFieldProps>;
    totalScannedTicket?: PrimitiveOverrideProps<TextFieldProps>;
    contactTemplate?: PrimitiveOverrideProps<TextAreaFieldProps>;
    startDate?: PrimitiveOverrideProps<TextFieldProps>;
    endDate?: PrimitiveOverrideProps<TextFieldProps>;
    sendCertificates?: PrimitiveOverrideProps<SwitchFieldProps>;
    certificate?: PrimitiveOverrideProps<TextFieldProps>;
    certificatePosition?: PrimitiveOverrideProps<TextAreaFieldProps>;
    certificatesSentAt?: PrimitiveOverrideProps<TextFieldProps>;
    Badge?: PrimitiveOverrideProps<AutocompleteProps>;
    SectionalElement0?: PrimitiveOverrideProps<HeadingProps>;
    usuarioUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    eventIdUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
    periodoUSFQ?: PrimitiveOverrideProps<TextFieldProps>;
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
