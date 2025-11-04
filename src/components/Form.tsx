"use client";

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import { fieldLabel, helperText, errorText } from "./formStyles";

type Rule = {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  len?: number;
  pattern?: RegExp;
  validator?: (
    value: unknown,
    values: Record<string, unknown>
  ) => string | void | Promise<string | void>;
};

type ValidateTrigger = "change" | "blur";

type SetValueOptions = {
  validate?: boolean;
};

export type FormInstance = {
  setFieldValue: (
    name: string,
    value: unknown,
    opts?: SetValueOptions
  ) => Promise<string[] | undefined>;
  setFieldsValue: (
    values: Record<string, unknown>,
    opts?: SetValueOptions
  ) => Promise<Record<string, string[]>>;
  getFieldValue: (name: string) => unknown;
  getFieldsValue: () => Record<string, unknown>;
  getError: (name: string) => string[] | undefined;
  validateField: (name: string) => Promise<string[]>;
  validateAll: () => Promise<Record<string, string[]>>;
  resetFieldsValue: (names?: string[]) => void;
  hasFieldValue: (name: string) => boolean;
};

type FormContextType = FormInstance & {
  values: Record<string, unknown>;
  errors: Record<string, string[]>;
  register: (name: string, options?: { rules?: Rule[] }) => void;
  unregister: (name: string) => void;
  layout?: "vertical" | "horizontal";
  labelWidth?: number | string;
  colon?: boolean;
};

const FormContext = createContext<FormContextType | null>(null);

const EXTERNAL_VALUE_UNSET = Symbol("form-external-unset");
const FULL_WIDTH_COLON = "：";

const hasOwn = (obj: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") {
    return { ...(value as Record<string, unknown>) };
  }
  return value;
}

function cloneInitialValues(initialValues?: Record<string, unknown>) {
  if (!initialValues) return {};
  const next: Record<string, unknown> = {};
  Object.keys(initialValues).forEach((key) => {
    const val = cloneValue(initialValues[key]);
    if (val !== undefined) {
      next[key] = val;
    }
  });
  return next;
}

function extractValueFromEvent(...args: unknown[]): unknown {
  if (!args.length) return undefined;
  const first = args[0] as any;

  if (first && typeof first === "object" && "target" in first) {
    const target = first.target as {
      value?: unknown;
      checked?: boolean;
    };
    if (typeof target.checked === "boolean") {
      return target.checked;
    }
    return target.value;
  }
  if (args.length === 1) return first;
  return args;
}

function useFormInternal(initialValues?: Record<string, unknown>): Omit<
  FormContextType,
  "layout" | "labelWidth" | "colon"
> {
  const rulesRef = useRef<Record<string, Rule[] | undefined>>({});
  const initialRef = useRef<Record<string, unknown>>(cloneInitialValues(initialValues));
  const valuesRef = useRef<Record<string, unknown>>(cloneInitialValues(initialValues));
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    cloneInitialValues(initialValues)
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const controlledRef = useRef<Record<string, boolean>>({});

  const markControlled = useCallback((name: string) => {
    controlledRef.current[name] = true;
  }, []);

  const hasFieldValue = useCallback(
    (name: string) =>
      !!controlledRef.current[name] || hasOwn(valuesRef.current, name),
    []
  );

  const register = useCallback(
    (name: string, options?: { rules?: Rule[] }) => {
      rulesRef.current[name] = options?.rules;
      if (hasOwn(valuesRef.current, name)) {
        markControlled(name);
      }
    },
    [markControlled]
  );

  const unregister = useCallback((name: string) => {
    delete rulesRef.current[name];
    delete controlledRef.current[name];
    if (hasOwn(valuesRef.current, name)) {
      const next = { ...valuesRef.current };
      delete next[name];
      valuesRef.current = next;
      setValues(next);
    }
    setErrors((prev) => {
      if (prev[name] == null) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const runRules = useCallback(
    async (
      name: string,
      value: unknown,
      currentValues: Record<string, unknown>
    ) => {
      const rules = rulesRef.current[name] || [];
      const result: string[] = [];
      for (const rule of rules) {
        if (rule.required) {
          const empty =
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "") ||
            (Array.isArray(value) && value.length === 0);
          if (empty) {
            result.push(rule.message || "必填项");
            continue;
          }
        }
        if (typeof rule.len === "number" && typeof value === "string") {
          if (value.length !== rule.len) {
            result.push(rule.message || `长度必须为${rule.len}`);
          }
        }
        if (typeof rule.min === "number") {
          if (typeof value === "number" && value < rule.min) {
            result.push(rule.message || `不能小于${rule.min}`);
          }
          if (typeof value === "string" && value.length < rule.min) {
            result.push(rule.message || `长度不能小于${rule.min}`);
          }
        }
        if (typeof rule.max === "number") {
          if (typeof value === "number" && value > rule.max) {
            result.push(rule.message || `不能大于${rule.max}`);
          }
          if (typeof value === "string" && value.length > rule.max) {
            result.push(rule.message || `长度不能大于${rule.max}`);
          }
        }
        if (rule.pattern && typeof value === "string") {
          if (!rule.pattern.test(value)) {
            result.push(rule.message || "格式不正确");
          }
        }
        if (rule.validator) {
          const message = await rule.validator(value, currentValues);
          if (typeof message === "string" && message) {
            result.push(message);
          }
        }
      }
      return result;
    },
    []
  );

  const getFieldValue = useCallback((name: string) => valuesRef.current[name], []);

  const getFieldsValue = useCallback(() => {
    const next: Record<string, unknown> = {};
    Object.keys(valuesRef.current).forEach((key) => {
      next[key] = cloneValue(valuesRef.current[key]);
    });
    return next;
  }, []);

  const getError = useCallback((name: string) => errors[name], [errors]);

  const setFieldValue = useCallback(
    async (name: string, value: unknown, opts?: SetValueOptions) => {
      if (value === undefined) {
        const next = { ...valuesRef.current };
        if (hasOwn(next, name)) {
          delete next[name];
        }
        valuesRef.current = next;
        delete controlledRef.current[name];
        setValues(next);
        if (opts?.validate) {
          const errs = await runRules(name, undefined, next);
          setErrors((prev) => ({ ...prev, [name]: errs }));
          return errs;
        }
        setErrors((prev) => {
          if (prev[name] == null) return prev;
          const nextErr = { ...prev };
          delete nextErr[name];
          return nextErr;
        });
        return undefined;
      }

      markControlled(name);
      const stored = cloneValue(value);
      const next = { ...valuesRef.current, [name]: stored };
      valuesRef.current = next;
      setValues(next);
      if (opts?.validate) {
        const errs = await runRules(name, stored, next);
        setErrors((prev) => ({ ...prev, [name]: errs }));
        return errs;
      }
      setErrors((prev) => {
        if (prev[name] == null) return prev;
        const nextErr = { ...prev };
        delete nextErr[name];
        return nextErr;
      });
      return undefined;
    },
    [markControlled, runRules]
  );

  const setFieldsValue = useCallback(
    async (incoming: Record<string, unknown>, opts?: SetValueOptions) => {
      if (!incoming || Object.keys(incoming).length === 0) return {};
      const next = { ...valuesRef.current };
      Object.keys(incoming).forEach((key) => {
        const raw = incoming[key];
        if (raw === undefined) {
          if (hasOwn(next, key)) {
            delete next[key];
          }
          delete controlledRef.current[key];
          return;
        }
        markControlled(key);
        next[key] = cloneValue(raw);
      });
      valuesRef.current = next;
      setValues(next);
      if (opts?.validate) {
        const result: Record<string, string[]> = {};
        for (const key of Object.keys(incoming)) {
          const errs = await runRules(key, next[key], next);
          if (errs.length) {
            result[key] = errs;
          }
        }
        setErrors((prev) => {
          const nextErr = { ...prev };
          for (const key of Object.keys(incoming)) {
            const errs = result[key];
            if (errs && errs.length) nextErr[key] = errs;
            else delete nextErr[key];
          }
          return nextErr;
        });
        return result;
      }
      setErrors((prev) => {
        const nextErr = { ...prev };
        for (const key of Object.keys(incoming)) {
          if (nextErr[key] != null) delete nextErr[key];
        }
        return nextErr;
      });
      return {};
    },
    [markControlled, runRules]
  );

  const validateField = useCallback(
    async (name: string) => {
      const currentValues = { ...valuesRef.current };
      const errs = await runRules(name, currentValues[name], currentValues);
      setErrors((prev) => ({ ...prev, [name]: errs }));
      return errs;
    },
    [runRules]
  );

  const validateAll = useCallback(async () => {
    const currentValues = { ...valuesRef.current };
    const result: Record<string, string[]> = {};
    const names = Object.keys(rulesRef.current);
    for (const name of names) {
      const errs = await runRules(name, currentValues[name], currentValues);
      if (errs.length) {
        result[name] = errs;
      }
    }
    setErrors(result);
    return result;
  }, [runRules]);

  const resetFieldsValue = useCallback((names?: string[]) => {
    if (!names || names.length === 0) {
      const next = cloneInitialValues(initialRef.current);
      valuesRef.current = next;
      const nextControlled: Record<string, boolean> = {};
      Object.keys(next).forEach((key) => {
        nextControlled[key] = true;
      });
      controlledRef.current = nextControlled;
      setValues(next);
      setErrors({});
      return;
    }
    const current = { ...valuesRef.current };
    names.forEach((name) => {
      if (hasOwn(initialRef.current, name)) {
        const init = cloneValue(initialRef.current[name]);
        if (init === undefined) {
          if (hasOwn(current, name)) {
            delete current[name];
          }
          delete controlledRef.current[name];
        } else {
          current[name] = init;
          controlledRef.current[name] = true;
        }
      } else {
        if (hasOwn(current, name)) {
          delete current[name];
        }
        delete controlledRef.current[name];
      }
    });
    valuesRef.current = current;
    setValues(current);
    setErrors((prev) => {
      const nextErr = { ...prev };
      for (const name of names) {
        if (nextErr[name] != null) delete nextErr[name];
      }
      return nextErr;
    });
  }, []);

  return useMemo(
    () => ({
      values,
      errors,
      register,
      unregister,
      setFieldValue,
      setFieldsValue,
      getFieldValue,
      getFieldsValue,
      getError,
      validateField,
      validateAll,
      resetFieldsValue,
      hasFieldValue
    }),
    [
      errors,
      getError,
      getFieldValue,
      getFieldsValue,
      hasFieldValue,
      register,
      resetFieldsValue,
      setFieldValue,
      setFieldsValue,
      unregister,
      validateAll,
      validateField,
      values
    ]
  );
}

export type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  initialValues?: Record<string, unknown>;
  onFinish?: (values: Record<string, unknown>) => void;
  onFinishFailed?: (opts: {
    values: Record<string, unknown>;
    errors: Record<string, string[]>;
  }) => void;
  layout?: "vertical" | "horizontal";
  labelWidth?: number | string;
  colon?: boolean;
};

const FormRoot = forwardRef<FormInstance, FormProps>(function FormRoot(
  {
    initialValues,
    onFinish,
    onFinishFailed,
    layout = "vertical",
    labelWidth,
    colon = true,
    className = "",
    onSubmit,
    children,
    ...rest
  },
  ref
) {
  const api = useFormInternal(initialValues);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    onSubmit?.(event);
    event.preventDefault();
    const errs = await api.validateAll();
    const hasError = Object.values(errs).some((arr) => arr && arr.length > 0);
    if (hasError) {
      onFinishFailed?.({
        values: api.getFieldsValue(),
        errors: errs
      });
    } else {
      onFinish?.(api.getFieldsValue());
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      setFieldValue: api.setFieldValue,
      setFieldsValue: api.setFieldsValue,
      getFieldValue: api.getFieldValue,
      getFieldsValue: api.getFieldsValue,
      getError: api.getError,
      validateField: api.validateField,
      validateAll: api.validateAll,
      resetFieldsValue: api.resetFieldsValue,
      hasFieldValue: api.hasFieldValue
    }),
    [api]
  );

  const contextValue = useMemo(
    () => ({
      ...api,
      layout,
      labelWidth,
      colon
    }),
    [api, layout, labelWidth, colon]
  );

  const labelStyleVar: React.CSSProperties | undefined =
    layout === "horizontal" && labelWidth != null
      ? ({
          ["--form-label-width" as const]:
            typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth
        } as React.CSSProperties)
      : undefined;

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={["space-y-3", className].join(" ")}
        {...rest}
      >
        <div style={labelStyleVar}>{children}</div>
      </form>
    </FormContext.Provider>
  );
});

export type FormItemProps = {
  name?: string;
  label?: React.ReactNode;
  rules?: Rule[];
  required?: boolean;
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  help?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  colon?: boolean;
};

function FormItem({
  name,
  label,
  rules,
  required,
  validateTrigger = "blur",
  help,
  extra,
  className = "",
  style,
  children,
  colon
}: FormItemProps) {
  const form = useContext(FormContext);
  if (!form) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  const {
    register,
    unregister,
    setFieldValue,
    getFieldValue,
    getError,
    validateField,
    hasFieldValue,
    layout,
    labelWidth,
    colon: formColon
  } = form;

  const rulesSignature = JSON.stringify(rules ?? []);

  React.useEffect(() => {
    if (!name) return;
    const merged = [...(rules || [])];
    if (required) merged.unshift({ required: true });
    register(name, { rules: merged });
    return () => {
      unregister(name);
    };
  }, [name, register, unregister, required, rulesSignature]);

  const value = name ? getFieldValue(name) : undefined;
  const errs = name ? getError(name) : undefined;
  const hasErr = !!(errs && errs.length > 0);

  const triggerList = Array.isArray(validateTrigger)
    ? validateTrigger
    : [validateTrigger ?? "blur"];
  const needChangeValidate = triggerList.includes("change");
  const needBlurValidate = triggerList.includes("blur");

  const childElement = React.isValidElement(children)
    ? (children as React.ReactElement)
    : null;

  const childOriginalProps = childElement
    ? (childElement.props as Record<string, unknown>)
    : undefined;
  const childHasValueProp =
    !!childOriginalProps &&
    Object.prototype.hasOwnProperty.call(childOriginalProps, "value");
  const childHasCheckedProp =
    !!childOriginalProps &&
    Object.prototype.hasOwnProperty.call(childOriginalProps, "checked");
  const externalValue = childHasCheckedProp
    ? childOriginalProps?.checked
    : childHasValueProp
    ? childOriginalProps?.value
    : undefined;
  const externallyControlled = childHasValueProp || childHasCheckedProp;

  const lastExternalValueRef = useRef<unknown>(EXTERNAL_VALUE_UNSET);

  useEffect(() => {
    if (!name || !externallyControlled) {
      lastExternalValueRef.current = EXTERNAL_VALUE_UNSET;
      return;
    }
    if (Object.is(lastExternalValueRef.current, externalValue)) {
      return;
    }
    lastExternalValueRef.current = externalValue;
    void setFieldValue(name, externalValue, { validate: false });
  }, [externallyControlled, externalValue, name, setFieldValue]);

  let childProps: Record<string, unknown> | null = null;
  if (name && childElement) {
    const formControlsField = hasFieldValue(name);
    const props: Record<string, unknown> = {};
    const resolvedValue = externallyControlled ? externalValue : value;
    const isControlled = formControlsField || externallyControlled;
    const originalProps = childOriginalProps as Record<string, unknown>;
    const childInputType =
      typeof originalProps?.type === "string" ? (originalProps.type as string) : undefined;
    const isNativeCheckboxOrRadio =
      typeof childElement.type === "string" &&
      childElement.type === "input" &&
      (childInputType === "checkbox" || childInputType === "radio");

    if (isControlled) {
      if (typeof resolvedValue === "boolean") {
        props.checked = resolvedValue;
        if (!isNativeCheckboxOrRadio) {
          props.value = resolvedValue;
        }
      } else if (resolvedValue !== undefined || externallyControlled) {
        props.value = resolvedValue;
      }
    }

    const originalOnChange = originalProps?.onChange as
      | ((...args: unknown[]) => void)
      | undefined;
    props.onChange = (...args: unknown[]) => {
      const nextValue = extractValueFromEvent(...args);
      void setFieldValue(name, nextValue, {
        validate: needChangeValidate
      });
      if (typeof originalOnChange === "function") {
        originalOnChange(...(args as unknown[]));
      }
    };

    const originalOnBlur = originalProps?.onBlur as
      | ((...args: unknown[]) => void)
      | undefined;
    props.onBlur = (...args: unknown[]) => {
      if (needBlurValidate) {
        void validateField(name);
      }
      if (typeof originalOnBlur === "function") {
        originalOnBlur(...(args as unknown[]));
      }
    };

    if (hasErr) {
      if (typeof childElement.type !== "string") {
        if ((originalProps?.status as unknown) == null) {
          props.status = "error";
        }
      }
      props["aria-invalid"] = true;
      props["data-form-error"] = "true";
    }

    childProps = props;
  }

  const control =
    childElement && childProps
      ? React.cloneElement(childElement, childProps)
      : childElement ?? children;

  const isHorizontal = layout === "horizontal";
  const showColon = typeof colon === "boolean" ? colon : formColon !== false;

  const renderLabel = () => {
    if (!label) return null;
    const requiredMark =
      !!required ||
      (Array.isArray(rules) ? rules.some((rule) => rule?.required) : false);
    return (
      <div className={fieldLabel}>
        <span className="text-error mr-1">{requiredMark ? "*" : ""}</span>
        <span className="text-gray-700">
          {label}
          {showColon ? FULL_WIDTH_COLON : ""}
        </span>
      </div>
    );
  };

  const renderHelp = () => {
    if (hasErr) return <div className={errorText}>{errs![0]}</div>;
    if (help) return <div className={helperText}>{help}</div>;
    if (extra) return <div className={helperText}>{extra}</div>;
    return null;
  };

  if (isHorizontal) {
    const labelBoxStyle: React.CSSProperties = {
      width: labelWidth
    };
    return (
      <div className={["mb-3", className].join(" ")} style={style}>
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 text-right flex items-center justify-end min-h-10"
            style={labelBoxStyle}
          >
            {renderLabel()}
          </div>
          <div className="flex-1">
            <div className="min-h-10 flex items-center">{control}</div>
            {renderHelp()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={["mb-3", className].join(" ")} style={style}>
      {renderLabel()}
      {control}
      {renderHelp()}
    </div>
  );
}

export function useForm() {
  // 使用 ref 暴露表单实例，方便在页面中通过 ref 操作
  return React.useRef<FormInstance | null>(null);
}

export function useFormContext() {
  return useContext(FormContext);
}

export const Form = Object.assign(FormRoot, { Item: FormItem, useForm, useFormContext });

export default Form;
