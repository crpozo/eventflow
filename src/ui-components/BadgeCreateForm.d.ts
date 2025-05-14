/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type BadgeCreateFormInputValues = {
    frontDesign?: string;
    backDesign?: string;
};
export declare type BadgeCreateFormValidationValues = {
    frontDesign?: ValidationFunction<string>;
    backDesign?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type BadgeCreateFormOverridesProps = {
    BadgeCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    frontDesign?: PrimitiveOverrideProps<TextFieldProps>;
    backDesign?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type BadgeCreateFormProps = React.PropsWithChildren<{
    overrides?: BadgeCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: BadgeCreateFormInputValues) => BadgeCreateFormInputValues;
    onSuccess?: (fields: BadgeCreateFormInputValues) => void;
    onError?: (fields: BadgeCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: BadgeCreateFormInputValues) => BadgeCreateFormInputValues;
    onValidate?: BadgeCreateFormValidationValues;
} & React.CSSProperties>;
export default function BadgeCreateForm(props: BadgeCreateFormProps): React.ReactElement;
