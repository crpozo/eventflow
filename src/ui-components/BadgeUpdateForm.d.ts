/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Badge as Badge0 } from "../models";
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
export declare type BadgeUpdateFormInputValues = {
    frontDesign?: string;
    backDesign?: string;
};
export declare type BadgeUpdateFormValidationValues = {
    frontDesign?: ValidationFunction<string>;
    backDesign?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type BadgeUpdateFormOverridesProps = {
    BadgeUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    frontDesign?: PrimitiveOverrideProps<TextFieldProps>;
    backDesign?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type BadgeUpdateFormProps = React.PropsWithChildren<{
    overrides?: BadgeUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    badge?: Badge0;
    onSubmit?: (fields: BadgeUpdateFormInputValues) => BadgeUpdateFormInputValues;
    onSuccess?: (fields: BadgeUpdateFormInputValues) => void;
    onError?: (fields: BadgeUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: BadgeUpdateFormInputValues) => BadgeUpdateFormInputValues;
    onValidate?: BadgeUpdateFormValidationValues;
} & React.CSSProperties>;
export default function BadgeUpdateForm(props: BadgeUpdateFormProps): React.ReactElement;
