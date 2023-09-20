/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { EventAttendee } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type EventAttendeeUpdateFormInputValues = {
    eventID?: string;
    attendeeID?: string;
    authorized?: boolean;
    checkIn?: boolean;
    formAnswers?: string;
    ticket?: string;
    email?: string;
    allowContact?: boolean;
};
export declare type EventAttendeeUpdateFormValidationValues = {
    eventID?: ValidationFunction<string>;
    attendeeID?: ValidationFunction<string>;
    authorized?: ValidationFunction<boolean>;
    checkIn?: ValidationFunction<boolean>;
    formAnswers?: ValidationFunction<string>;
    ticket?: ValidationFunction<string>;
    email?: ValidationFunction<string>;
    allowContact?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventAttendeeUpdateFormOverridesProps = {
    EventAttendeeUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventID?: PrimitiveOverrideProps<AutocompleteProps>;
    attendeeID?: PrimitiveOverrideProps<AutocompleteProps>;
    authorized?: PrimitiveOverrideProps<SwitchFieldProps>;
    checkIn?: PrimitiveOverrideProps<SwitchFieldProps>;
    formAnswers?: PrimitiveOverrideProps<TextAreaFieldProps>;
    ticket?: PrimitiveOverrideProps<TextFieldProps>;
    email?: PrimitiveOverrideProps<TextFieldProps>;
    allowContact?: PrimitiveOverrideProps<SwitchFieldProps>;
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
