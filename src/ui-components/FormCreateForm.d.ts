/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, TextAreaFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Event as Event0 } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type FormCreateFormInputValues = {
    questions?: string;
    Event?: Event0;
};
export declare type FormCreateFormValidationValues = {
    questions?: ValidationFunction<string>;
    Event?: ValidationFunction<Event0>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FormCreateFormOverridesProps = {
    FormCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    questions?: PrimitiveOverrideProps<TextAreaFieldProps>;
    Event?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type FormCreateFormProps = React.PropsWithChildren<{
    overrides?: FormCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: FormCreateFormInputValues) => FormCreateFormInputValues;
    onSuccess?: (fields: FormCreateFormInputValues) => void;
    onError?: (fields: FormCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FormCreateFormInputValues) => FormCreateFormInputValues;
    onValidate?: FormCreateFormValidationValues;
} & React.CSSProperties>;
export default function FormCreateForm(props: FormCreateFormProps): React.ReactElement;
