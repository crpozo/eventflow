/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EventAttendee, PaymentLog } from "../models";
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
export declare type EventAttendeeUpdateFormInputValues = {
    eventID?: string;
    attendeeID?: string;
    email?: string;
    authorized?: boolean;
    checkIn?: boolean;
    formAnswers?: string;
    ticket?: string;
    allowContact?: boolean;
    quantity?: number;
    scanned?: number;
    profileURL?: string;
    PaymentLogs?: PaymentLog[];
};
export declare type EventAttendeeUpdateFormValidationValues = {
    eventID?: ValidationFunction<string>;
    attendeeID?: ValidationFunction<string>;
    email?: ValidationFunction<string>;
    authorized?: ValidationFunction<boolean>;
    checkIn?: ValidationFunction<boolean>;
    formAnswers?: ValidationFunction<string>;
    ticket?: ValidationFunction<string>;
    allowContact?: ValidationFunction<boolean>;
    quantity?: ValidationFunction<number>;
    scanned?: ValidationFunction<number>;
    profileURL?: ValidationFunction<string>;
    PaymentLogs?: ValidationFunction<PaymentLog>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventAttendeeUpdateFormOverridesProps = {
    EventAttendeeUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventID?: PrimitiveOverrideProps<AutocompleteProps>;
    attendeeID?: PrimitiveOverrideProps<AutocompleteProps>;
    email?: PrimitiveOverrideProps<TextFieldProps>;
    authorized?: PrimitiveOverrideProps<SwitchFieldProps>;
    checkIn?: PrimitiveOverrideProps<SwitchFieldProps>;
    formAnswers?: PrimitiveOverrideProps<TextAreaFieldProps>;
    ticket?: PrimitiveOverrideProps<TextFieldProps>;
    allowContact?: PrimitiveOverrideProps<SwitchFieldProps>;
    quantity?: PrimitiveOverrideProps<TextFieldProps>;
    scanned?: PrimitiveOverrideProps<TextFieldProps>;
    profileURL?: PrimitiveOverrideProps<TextFieldProps>;
    PaymentLogs?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type EventAttendeeUpdateFormProps = React.PropsWithChildren<{
    overrides?: EventAttendeeUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    eventAttendee?: EventAttendee;
    onSubmit?: (fields: EventAttendeeUpdateFormInputValues) => EventAttendeeUpdateFormInputValues;
    onSuccess?: (fields: EventAttendeeUpdateFormInputValues) => void;
    onError?: (fields: EventAttendeeUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: EventAttendeeUpdateFormInputValues) => EventAttendeeUpdateFormInputValues;
    onValidate?: EventAttendeeUpdateFormValidationValues;
} & React.CSSProperties>;
export default function EventAttendeeUpdateForm(props: EventAttendeeUpdateFormProps): React.ReactElement;
