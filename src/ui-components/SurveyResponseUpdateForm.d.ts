/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { SurveyResponse } from "../models";
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
export declare type SurveyResponseUpdateFormInputValues = {
    surveyID?: string;
    eventID?: string;
    token?: string;
    answers?: string;
};
export declare type SurveyResponseUpdateFormValidationValues = {
    surveyID?: ValidationFunction<string>;
    eventID?: ValidationFunction<string>;
    token?: ValidationFunction<string>;
    answers?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SurveyResponseUpdateFormOverridesProps = {
    SurveyResponseUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    surveyID?: PrimitiveOverrideProps<TextFieldProps>;
    eventID?: PrimitiveOverrideProps<TextFieldProps>;
    token?: PrimitiveOverrideProps<TextFieldProps>;
    answers?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type SurveyResponseUpdateFormProps = React.PropsWithChildren<{
    overrides?: SurveyResponseUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    surveyResponse?: SurveyResponse;
    onSubmit?: (fields: SurveyResponseUpdateFormInputValues) => SurveyResponseUpdateFormInputValues;
    onSuccess?: (fields: SurveyResponseUpdateFormInputValues) => void;
    onError?: (fields: SurveyResponseUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SurveyResponseUpdateFormInputValues) => SurveyResponseUpdateFormInputValues;
    onValidate?: SurveyResponseUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SurveyResponseUpdateForm(props: SurveyResponseUpdateFormProps): React.ReactElement;
