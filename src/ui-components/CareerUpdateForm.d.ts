/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Career } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type CareerUpdateFormInputValues = {
    title?: string;
    areaID?: string;
};
export declare type CareerUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
    areaID?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CareerUpdateFormOverridesProps = {
    CareerUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    areaID?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type CareerUpdateFormProps = React.PropsWithChildren<{
    overrides?: CareerUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    career?: Career;
    onSubmit?: (fields: CareerUpdateFormInputValues) => CareerUpdateFormInputValues;
    onSuccess?: (fields: CareerUpdateFormInputValues) => void;
    onError?: (fields: CareerUpdateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: CareerUpdateFormInputValues) => CareerUpdateFormInputValues;
    onValidate?: CareerUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CareerUpdateForm(props: CareerUpdateFormProps): React.ReactElement;
