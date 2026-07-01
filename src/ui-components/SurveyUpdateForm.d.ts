/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, SwitchFieldProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
import { Survey, Event as Event0 } from "../models";
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
export declare type SurveyUpdateFormInputValues = {
    questions?: string;
    active?: boolean;
    emailSubject?: string;
    emailIntro?: string;
    sendAt?: string;
    sentAt?: string;
    insights?: string;
    insightsAt?: string;
    Event?: Event0;
};
export declare type SurveyUpdateFormValidationValues = {
    questions?: ValidationFunction<string>;
    active?: ValidationFunction<boolean>;
    emailSubject?: ValidationFunction<string>;
    emailIntro?: ValidationFunction<string>;
    sendAt?: ValidationFunction<string>;
    sentAt?: ValidationFunction<string>;
    insights?: ValidationFunction<string>;
    insightsAt?: ValidationFunction<string>;
    Event?: ValidationFunction<Event0>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type SurveyUpdateFormOverridesProps = {
    SurveyUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    questions?: PrimitiveOverrideProps<TextAreaFieldProps>;
    active?: PrimitiveOverrideProps<SwitchFieldProps>;
    emailSubject?: PrimitiveOverrideProps<TextFieldProps>;
    emailIntro?: PrimitiveOverrideProps<TextFieldProps>;
    sendAt?: PrimitiveOverrideProps<TextFieldProps>;
    sentAt?: PrimitiveOverrideProps<TextFieldProps>;
    insights?: PrimitiveOverrideProps<TextAreaFieldProps>;
    insightsAt?: PrimitiveOverrideProps<TextFieldProps>;
    Event?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type SurveyUpdateFormProps = React.PropsWithChildren<{
    overrides?: SurveyUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    survey?: Survey;
    onSubmit?: (fields: SurveyUpdateFormInputValues) => SurveyUpdateFormInputValues;
    onSuccess?: (fields: SurveyUpdateFormInputValues) => void;
    onError?: (fields: SurveyUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: SurveyUpdateFormInputValues) => SurveyUpdateFormInputValues;
    onValidate?: SurveyUpdateFormValidationValues;
} & React.CSSProperties>;
export default function SurveyUpdateForm(props: SurveyUpdateFormProps): React.ReactElement;
