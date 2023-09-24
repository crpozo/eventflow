/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type EventAttendeCreateFormInputValues = {
    eventID?: string;
    attendeeID?: string;
    authorized?: boolean;
    checkIn?: boolean;
};
export declare type EventAttendeCreateFormValidationValues = {
    eventID?: ValidationFunction<string>;
    attendeeID?: ValidationFunction<string>;
    authorized?: ValidationFunction<boolean>;
    checkIn?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventAttendeCreateFormOverridesProps = {
    EventAttendeCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventID?: PrimitiveOverrideProps<AutocompleteProps>;
    attendeeID?: PrimitiveOverrideProps<AutocompleteProps>;
    authorized?: PrimitiveOverrideProps<SwitchFieldProps>;
    checkIn?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type EventAttendeCreateFormProps = React.PropsWithChildren<{
    overrides?: EventAttendeCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: EventAttendeCreateFormInputValues) => EventAttendeCreateFormInputValues;
    onSuccess?: (fields: EventAttendeCreateFormInputValues) => void;
    onError?: (fields: EventAttendeCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: EventAttendeCreateFormInputValues) => EventAttendeCreateFormInputValues;
    onValidate?: EventAttendeCreateFormValidationValues;
} & React.CSSProperties>;
export default function EventAttendeCreateForm(props: EventAttendeCreateFormProps): React.ReactElement;
