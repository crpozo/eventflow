/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type CareerCreateFormInputValues = {
    title?: string;
    areaID?: string;
};
export declare type CareerCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    areaID?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CareerCreateFormOverridesProps = {
    CareerCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    areaID?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type CareerCreateFormProps = React.PropsWithChildren<{
    overrides?: CareerCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CareerCreateFormInputValues) => CareerCreateFormInputValues;
    onSuccess?: (fields: CareerCreateFormInputValues) => void;
    onError?: (fields: CareerCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CareerCreateFormInputValues) => CareerCreateFormInputValues;
    onValidate?: CareerCreateFormValidationValues;
} & React.CSSProperties>;
export default function CareerCreateForm(props: CareerCreateFormProps): React.ReactElement;
