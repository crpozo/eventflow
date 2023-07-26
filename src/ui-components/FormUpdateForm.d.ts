/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Form } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type FormUpdateFormInputValues = {
    questions?: string;
};
export declare type FormUpdateFormValidationValues = {
    questions?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type FormUpdateFormOverridesProps = {
    FormUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    questions?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type FormUpdateFormProps = React.PropsWithChildren<{
    overrides?: FormUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    form?: Form;
    onSubmit?: (fields: FormUpdateFormInputValues) => FormUpdateFormInputValues;
    onSuccess?: (fields: FormUpdateFormInputValues) => void;
    onError?: (fields: FormUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: FormUpdateFormInputValues) => FormUpdateFormInputValues;
    onValidate?: FormUpdateFormValidationValues;
} & React.CSSProperties>;
export default function FormUpdateForm(props: FormUpdateFormProps): React.ReactElement;
