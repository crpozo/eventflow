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
export declare type LandingCreateFormInputValues = {
    title?: string;
};
export declare type LandingCreateFormValidationValues = {
    title?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LandingCreateFormOverridesProps = {
    LandingCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type LandingCreateFormProps = React.PropsWithChildren<{
    overrides?: LandingCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: LandingCreateFormInputValues) => LandingCreateFormInputValues;
    onSuccess?: (fields: LandingCreateFormInputValues) => void;
    onError?: (fields: LandingCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: LandingCreateFormInputValues) => LandingCreateFormInputValues;
    onValidate?: LandingCreateFormValidationValues;
} & React.CSSProperties>;
export default function LandingCreateForm(props: LandingCreateFormProps): React.ReactElement;
