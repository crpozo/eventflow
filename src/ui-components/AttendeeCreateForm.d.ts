/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Event } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type AttendeeCreateFormInputValues = {
    name?: string;
    type?: string;
    age?: number;
    position?: string;
    authorized?: boolean;
    checkIn?: boolean;
    events?: Event[];
};
export declare type AttendeeCreateFormValidationValues = {
    name?: ValidationFunction<string>;
    type?: ValidationFunction<string>;
    age?: ValidationFunction<number>;
    position?: ValidationFunction<string>;
    authorized?: ValidationFunction<boolean>;
    checkIn?: ValidationFunction<boolean>;
    events?: ValidationFunction<Event>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AttendeeCreateFormOverridesProps = {
    AttendeeCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    name?: PrimitiveOverrideProps<TextFieldProps>;
    type?: PrimitiveOverrideProps<TextFieldProps>;
    age?: PrimitiveOverrideProps<TextFieldProps>;
    position?: PrimitiveOverrideProps<TextFieldProps>;
    authorized?: PrimitiveOverrideProps<SwitchFieldProps>;
    checkIn?: PrimitiveOverrideProps<SwitchFieldProps>;
    events?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type AttendeeCreateFormProps = React.PropsWithChildren<{
    overrides?: AttendeeCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AttendeeCreateFormInputValues) => AttendeeCreateFormInputValues;
    onSuccess?: (fields: AttendeeCreateFormInputValues) => void;
    onError?: (fields: AttendeeCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: AttendeeCreateFormInputValues) => AttendeeCreateFormInputValues;
    onValidate?: AttendeeCreateFormValidationValues;
} & React.CSSProperties>;
export default function AttendeeCreateForm(props: AttendeeCreateFormProps): React.ReactElement;
