/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { StorageManagerProps } from "@aws-amplify/ui-react-storage";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Landing } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type LandingUpdateFormInputValues = {
    title?: string;
    description?: string;
    mainBanner?: string;
    location?: string;
    cost?: string;
    ticketTitle?: string[];
    ticketPrice?: number[];
    extraInfo?: string;
    active?: boolean;
};
export declare type LandingUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
    description?: ValidationFunction<string>;
    mainBanner?: ValidationFunction<string>;
    location?: ValidationFunction<string>;
    cost?: ValidationFunction<string>;
    ticketTitle?: ValidationFunction<string>;
    ticketPrice?: ValidationFunction<number>;
    extraInfo?: ValidationFunction<string>;
    active?: ValidationFunction<boolean>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LandingUpdateFormOverridesProps = {
    LandingUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    description?: PrimitiveOverrideProps<TextAreaFieldProps>;
    mainBanner?: PrimitiveOverrideProps<StorageManagerProps>;
    location?: PrimitiveOverrideProps<TextFieldProps>;
    cost?: PrimitiveOverrideProps<TextFieldProps>;
    ticketTitle?: PrimitiveOverrideProps<TextFieldProps>;
    ticketPrice?: PrimitiveOverrideProps<TextFieldProps>;
    extraInfo?: PrimitiveOverrideProps<TextAreaFieldProps>;
    active?: PrimitiveOverrideProps<SwitchFieldProps>;
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
