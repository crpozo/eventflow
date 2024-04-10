/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SelectFieldProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { StorageManagerProps } from "@aws-amplify/ui-react-storage";
import { Landing } from "../models";
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
export declare type LandingUpdateFormInputValues = {
    active?: boolean;
    title?: string;
    description?: string;
    mainBanner?: string;
    location?: string;
    cost?: string;
    ticketTitle?: string[];
    ticketPrice?: number[];
    extraInfo?: string;
};
export declare type LandingUpdateFormValidationValues = {
    active?: ValidationFunction<boolean>;
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
export declare type LandingUpdateFormOverridesProps = {
    LandingUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    active?: PrimitiveOverrideProps<SwitchFieldProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextAreaFieldProps>;
    mainBanner?: PrimitiveOverrideProps<StorageManagerProps>;
    location?: PrimitiveOverrideProps<TextFieldProps>;
    cost?: PrimitiveOverrideProps<SelectFieldProps>;
    ticketTitle?: PrimitiveOverrideProps<TextFieldProps>;
    ticketPrice?: PrimitiveOverrideProps<TextFieldProps>;
    extraInfo?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type LandingUpdateFormProps = React.PropsWithChildren<{
    overrides?: LandingUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    landing?: Landing;
    onSubmit?: (fields: LandingUpdateFormInputValues) => LandingUpdateFormInputValues;
    onSuccess?: (fields: LandingUpdateFormInputValues) => void;
    onError?: (fields: LandingUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: LandingUpdateFormInputValues) => LandingUpdateFormInputValues;
    onValidate?: LandingUpdateFormValidationValues;
} & React.CSSProperties>;
export default function LandingUpdateForm(props: LandingUpdateFormProps): React.ReactElement;
