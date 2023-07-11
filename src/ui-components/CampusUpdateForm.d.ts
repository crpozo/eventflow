/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
import { Campus } from "../models";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type CampusUpdateFormInputValues = {
    title?: string;
};
export declare type CampusUpdateFormValidationValues = {
    title?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type CampusUpdateFormOverridesProps = {
    CampusUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type CampusUpdateFormProps = React.PropsWithChildren<{
    overrides?: CampusUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    campus?: Campus;
    onSubmit?: (fields: CampusUpdateFormInputValues) => CampusUpdateFormInputValues;
    onSuccess?: (fields: CampusUpdateFormInputValues) => void;
    onError?: (fields: CampusUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: CampusUpdateFormInputValues) => CampusUpdateFormInputValues;
    onValidate?: CampusUpdateFormValidationValues;
} & React.CSSProperties>;
export default function CampusUpdateForm(props: CampusUpdateFormProps): React.ReactElement;
