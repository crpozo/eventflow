/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { AutocompleteProps, GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { EscapeHatchProps } from "@aws-amplify/ui-react/internal";
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type AreaCreateFormInputValues = {
    title?: string;
    campusID?: string;
};
export declare type AreaCreateFormValidationValues = {
    title?: ValidationFunction<string>;
    campusID?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type AreaCreateFormOverridesProps = {
    AreaCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    title?: PrimitiveOverrideProps<TextFieldProps>;
    campusID?: PrimitiveOverrideProps<AutocompleteProps>;
} & EscapeHatchProps;
export declare type AreaCreateFormProps = React.PropsWithChildren<{
    overrides?: AreaCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: AreaCreateFormInputValues) => AreaCreateFormInputValues;
    onSuccess?: (fields: AreaCreateFormInputValues) => void;
    onError?: (fields: AreaCreateFormInputValues, errorMessage: string) => void;
    onCancel?: () => void;
    onChange?: (fields: AreaCreateFormInputValues) => AreaCreateFormInputValues;
    onValidate?: AreaCreateFormValidationValues;
} & React.CSSProperties>;
export default function AreaCreateForm(props: AreaCreateFormProps): React.ReactElement;
