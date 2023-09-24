/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type CreateCampusInputValues = {
    title?: string;
};
export declare type CreateCampusValidationValues = {
    title?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CreateCampusOverridesProps = {
    CreateCampusGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CreateCampusProps = React.PropsWithChildren<{
    overrides?: CreateCampusOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: CreateCampusInputValues) => CreateCampusInputValues;
    onSuccess?: (fields: CreateCampusInputValues) => void;
    onError?: (fields: CreateCampusInputValues, errorMessage: string) => void;
    onChange?: (fields: CreateCampusInputValues) => CreateCampusInputValues;
    onValidate?: CreateCampusValidationValues;
} & React.CSSProperties>;
export default function CreateCampus(props: CreateCampusProps): React.ReactElement;
