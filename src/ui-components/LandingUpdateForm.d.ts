/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Landing } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type LandingUpdateFormInputValues = {
    title?: string;
};
export declare type LandingUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type LandingUpdateFormOverridesProps = {
    LandingUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
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
