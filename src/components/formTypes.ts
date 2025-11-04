export type FormValue = unknown;

export type FormValues<TField extends string = string, TValue = FormValue> = Record<
  TField,
  TValue
>;

export type FormErrors<TField extends string = string> = Record<TField, string[]>;

export type FormRule<
  TValue = FormValue,
  TValues extends FormValues = FormValues
> = {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  validator?: (
    value: TValue,
    values: TValues
  ) => string | void | Promise<string | void>;
};

export type FormValidateTrigger = "change" | "blur";

export type FormSetValueOptions = {
  validate?: boolean;
};

export type FormChangeHandler<TValue, TResult = void> = (
  value: TValue
) => TResult;

export type FormValueProps<TValue, TResult = void> = {
  value?: TValue;
  defaultValue?: TValue;
  onChange?: FormChangeHandler<TValue, TResult>;
};

export type WithFormFieldValue<
  TNativeProps,
  TValue,
  TResult = void
> = Omit<TNativeProps, "value" | "defaultValue" | "onChange"> &
  FormValueProps<TValue, TResult>;

export type FormLayout = "vertical" | "horizontal";

export type FormSubmitHandler<TValues extends FormValues = FormValues> = (
  values: TValues
) => void;

export type FormSubmitFailedHandler<
  TValues extends FormValues = FormValues
> = (details: { values: TValues; errors: FormErrors }) => void;

export type FormItemTriggers = FormValidateTrigger | FormValidateTrigger[];
