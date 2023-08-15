/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { StorageManagerProps } from "@aws-amplify/ui-react-storage";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type LandingCreateFormInputValues = {
    title?: string;
    description?: string;
    mainBanner?: string;
    location?: string;
    cost?: string;
    ticketTitle?: string[];
    ticketPrice?: number[];
    extraInfo?: string;
};
export declare type LandingCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    mainBanner?: ValidationFunction<string>;
    location?: ValidationFunction<string>;
    cost?: ValidationFunction<string>;
    ticketTitle?: ValidationFunction<string>;
    ticketPrice?: ValidationFunction<number>;
    extraInfo?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LandingCreateFormOverridesProps = {
    LandingCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextAreaFieldProps>;
    mainBanner?: PrimitiveOverrideProps<StorageManagerProps>;
    location?: PrimitiveOverrideProps<TextFieldProps>;
    cost?: PrimitiveOverrideProps<TextFieldProps>;
    ticketTitle?: PrimitiveOverrideProps<TextFieldProps>;
    ticketPrice?: PrimitiveOverrideProps<TextFieldProps>;
    extraInfo?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type LandingCreateFormProps = React.PropsWithChildren<{
    overrides?: LandingCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: LandingCreateFormInputValues) => LandingCreateFormInputValues;
    onSuccess?: (fields: LandingCreateFormInputValues) => void;
    onError?: (fields: LandingCreateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: LandingCreateFormInputValues) => LandingCreateFormInputValues;
    onValidate?: LandingCreateFormValidationValues;
} & React.CSSProperties>;
export default function LandingCreateForm(props: LandingCreateFormProps): React.ReactElement;
