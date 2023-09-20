/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { EventAttende } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type EventAttendeUpdateFormInputValues = {
    eventID?: string;
    attendeeID?: string;
    authorized?: boolean;
    checkIn?: boolean;
};
export declare type EventAttendeUpdateFormValidationValues = {
    eventID?: ValidationFunction<string>;
    attendeeID?: ValidationFunction<string>;
    authorized?: ValidationFunction<boolean>;
    checkIn?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type EventAttendeUpdateFormOverridesProps = {
    EventAttendeUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    eventID?: PrimitiveOverrideProps<AutocompleteProps>;
    attendeeID?: PrimitiveOverrideProps<AutocompleteProps>;
    authorized?: PrimitiveOverrideProps<SwitchFieldProps>;
    checkIn?: PrimitiveOverrideProps<SwitchFieldProps>;
} & EscapeHatchProps;
export declare type EventAttendeUpdateFormProps = React.PropsWithChildren<{
    overrides?: EventAttendeUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    eventAttende?: EventAttende;
    onSubmit?: (fields: EventAttendeUpdateFormInputValues) => EventAttendeUpdateFormInputValues;
    onSuccess?: (fields: EventAttendeUpdateFormInputValues) => void;
    onError?: (fields: EventAttendeUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: EventAttendeUpdateFormInputValues) => EventAttendeUpdateFormInputValues;
    onValidate?: EventAttendeUpdateFormValidationValues;
} & React.CSSProperties>;
export default function EventAttendeUpdateForm(props: EventAttendeUpdateFormProps): React.ReactElement;
