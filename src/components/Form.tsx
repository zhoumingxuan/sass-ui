"use client";

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
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
  touch?: boolean;
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
};

type FormContextType = FormInstance & {
  values: Record<string, unknown>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  register: (name: string, options: { rules?: Rule[] }) => void;
  unregister: (name: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  layout?: "vertical" | "horizontal";
  labelWidth?: number | string;
  colon?: boolean;
};

const FormContext = createContext<FormContextType | null>(null);

const hasOwn = (obj: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function cloneValue(value: unknown) {
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
    next[key] = cloneValue(initialValues[key]);
  });
  return next;
}

function useFormInternal(initialValues?: Record<string, unknown>): FormContextType {
  const rulesRef = useRef<Record<string, Rule[] | undefined>>({});
  const initialRef = useRef<Record<string, unknown>>(cloneInitialValues(initialValues));
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    cloneInitialValues(initialValues)
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});

  const setTouched = useCallback((name: string, touchedFlag: boolean) => {
    setTouchedState((prev) => {
      if (touchedFlag) {
        if (prev[name]) return prev;
        return { ...prev, [name]: true };
      }
      if (!hasOwn(prev, name)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const register = useCallback((name: string, options: { rules?: Rule[] }) => {
    rulesRef.current[name] = options.rules;
  }, []);

  const unregister = useCallback((name: string) => {
    delete rulesRef.current[name];
    setValues((prev) => {
      if (!hasOwn(prev, name)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setErrors((prev) => {
      if (prev[name] == null) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setTouchedState((prev) => {
      if (!prev[name]) return prev;
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
            result.push(rule.message || "\u5fc5\u586b\u9879");
            continue;
          }
        }
        if (typeof rule.len === "number" && typeof value === "string") {
          if (value.length !== rule.len) {
            result.push(rule.message || `\u957f\u5ea6\u5fc5\u987b\u4e3a${rule.len}`);
          }
        }
        if (typeof rule.min === "number") {
          if (typeof value === "number" && value < rule.min) {
            result.push(rule.message || `\u4e0d\u80fd\u5c0f\u4e8e${rule.min}`);
          }
          if (typeof value === "string" && value.length < rule.min) {
            result.push(rule.message || `\u957f\u5ea6\u4e0d\u80fd\u5c0f\u4e8e${rule.min}`);
          }
        }
        if (typeof rule.max === "number") {
          if (typeof value === "number" && value > rule.max) {
            result.push(rule.message || `\u4e0d\u80fd\u5927\u4e8e${rule.max}`);
          }
          if (typeof value === "string" && value.length > rule.max) {
            result.push(rule.message || `\u957f\u5ea6\u4e0d\u80fd\u5927\u4e8e${rule.max}`);
          }
        }
        if (rule.pattern && typeof value === "string") {
          if (!rule.pattern.test(value)) {
            result.push(rule.message || "\u683c\u5f0f\u4e0d\u6b63\u786e");
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

  const getError = useCallback((name: string) => errors[name], [errors]);

  const getFieldValue = useCallback((name: string) => values[name], [values]);

  const getFieldsValue = useCallback(() => {
    const next: Record<string, unknown> = {};
    Object.keys(values).forEach((key) => {
      next[key] = cloneValue(values[key]);
    });
    return next;
  }, [values]);

  const setFieldValue = useCallback(
    async (name: string, value: unknown, opts?: SetValueOptions) => {
      let nextValues = values;
      setValues((prev) => {
        const next = { ...prev };
        if (value === undefined) {
          if (hasOwn(next, name)) {
            delete next[name];
          }
        } else {
          next[name] = value;
        }
        nextValues = next;
        return next;
      });

      if (opts?.touch) {
        setTouchedState((prev) => {
          if (prev[name]) return prev;
          return { ...prev, [name]: true };
        });
      }

      if (opts?.validate) {
        const errs = await runRules(name, value, nextValues);
        setErrors((prev) => {
          const next = { ...prev };
          if (errs.length) next[name] = errs;
          else delete next[name];
          return next;
        });
        return errs;
      }

      setErrors((prev) => {
        if (prev[name] == null) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
      return undefined;
    },
    [runRules, values]
  );

  const setFieldsValue = useCallback(
    async (incoming: Record<string, unknown>, opts?: SetValueOptions) => {
      const entries = Object.entries(incoming);
      if (entries.length === 0) return {};

      let nextValues = values;
      setValues((prev) => {
        const next = { ...prev };
        for (const [key, value] of entries) {
          if (value === undefined) {
            if (hasOwn(next, key)) {
              delete next[key];
            }
          } else {
            next[key] = value;
          }
        }
        nextValues = next;
        return next;
      });

      if (opts?.touch) {
        setTouchedState((prev) => {
          const next = { ...prev };
          for (const [key] of entries) {
            next[key] = true;
          }
          return next;
        });
      }

      if (opts?.validate) {
        const result: Record<string, string[]> = {};
        for (const [key, value] of entries) {
          const errs = await runRules(key, value, nextValues);
          if (errs.length) {
            result[key] = errs;
          }
        }
        setErrors((prev) => {
          const next = { ...prev };
          for (const [key] of entries) {
            const errs = result[key];
            if (errs && errs.length) next[key] = errs;
            else delete next[key];
          }
          return next;
        });
        return result;
      }

      setErrors((prev) => {
        const next = { ...prev };
        for (const [key] of entries) {
          if (next[key] != null) delete next[key];
        }
        return next;
      });
      return {};
    },
    [runRules, values]
  );

  const validateField = useCallback(
    async (name: string) => {
      const currentValues = { ...values };
      const errs = await runRules(name, currentValues[name], currentValues);
      setErrors((prev) => {
        const next = { ...prev };
        if (errs.length) next[name] = errs;
        else delete next[name];
        return next;
      });
      return errs;
    },
    [runRules, values]
  );

  const validateAll = useCallback(async () => {
    const currentValues = { ...values };
    const names = Object.keys(rulesRef.current);
    const result: Record<string, string[]> = {};
    for (const name of names) {
      const errs = await runRules(name, currentValues[name], currentValues);
      if (errs.length) {
        result[name] = errs;
      }
    }
    setErrors(result);
    return result;
  }, [runRules, values]);

  const resetFieldsValue = useCallback((names?: string[]) => {
    if (Array.isArray(names) && names.length > 0) {
      setValues((prev) => {
        const next = { ...prev };
        names.forEach((name) => {
          if (hasOwn(initialRef.current, name)) {
            const value = initialRef.current[name];
            if (value === undefined) {
              delete next[name];
            } else {
              next[name] = cloneValue(value);
            }
          } else {
            delete next[name];
          }
        });
        return next;
      });
      setErrors((prev) => {
        const next = { ...prev };
        names.forEach((name) => {
          if (next[name] != null) delete next[name];
        });
        return next;
      });
      setTouchedState((prev) => {
        const next = { ...prev };
        names.forEach((name) => {
          if (next[name]) delete next[name];
        });
        return next;
      });
      return;
    }
    setValues(cloneInitialValues(initialRef.current));
    setErrors({});
    setTouchedState({});
  }, []);

  return {
    values,
    errors,
    touched,
    register,
    unregister,
    setTouched,
    setFieldValue,
    setFieldsValue,
    getFieldValue,
    getFieldsValue,
    getError,
    validateField,
    validateAll,
    resetFieldsValue
  };
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
    const hasError = Object.values(errs).some((list) => list && list.length > 0);
    if (hasError) {
      onFinishFailed?.({ values: api.getFieldsValue(), errors: errs });
    } else {
      onFinish?.(api.getFieldsValue());
    }
  };

  const ctx = useMemo<FormContextType>(
    () => ({
      ...api,
      layout,
      labelWidth,
      colon
    }),
    [api, layout, labelWidth, colon]
  );

  const {
    setFieldValue,
    setFieldsValue,
    getFieldValue,
    getFieldsValue,
    resetFieldsValue,
    validateField,
    validateAll,
    getError
  } = api;

  React.useImperativeHandle(
    ref,
    () => ({
      setFieldValue,
      setFieldsValue,
      getFieldValue,
      getFieldsValue,
      resetFieldsValue,
      validateField,
      validateAll,
      getError
    }),
    [
      setFieldValue,
      setFieldsValue,
      getFieldValue,
      getFieldsValue,
      resetFieldsValue,
      validateField,
      validateAll,
      getError
    ]
  );

  const labelStyleVar: React.CSSProperties | undefined =
    layout === "horizontal" && labelWidth != null
      ? ({
          ["--form-label-width" as const]:
            typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth
        } as React.CSSProperties)
      : undefined;

  return (
    <FormContext.Provider value={ctx}>
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
  valuePropName?: string;
  trigger?: string;
  validateTrigger?: ValidateTrigger | ValidateTrigger[];
  normalize?: (value: unknown, values: Record<string, unknown>) => unknown;
  getValueFromEvent?: (...args: unknown[]) => unknown;
  help?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  colon?: boolean;
};

function defaultGetValueFromEvent(
  valuePropName: string,
  ...args: unknown[]
): unknown {
  if (!args || args.length === 0) return undefined;
  const first = args[0] as unknown;
  if (
    first &&
    typeof first === "object" &&
    "target" in (first as { target?: { checked?: boolean; value?: unknown } })
  ) {
    const target = (first as { target?: { checked?: boolean; value?: unknown } })
      .target;
    if (!target) return undefined;
    if (valuePropName === "checked") return target.checked;
    return target.value;
  }
  if (args.length > 1) return args;
  return args[0];
}

function isIntrinsicElement(el: React.ReactElement) {
  return typeof el.type === "string";
}

function FormItem({
  name,
  label,
  rules,
  required,
  valuePropName = "value",
  trigger = "onChange",
  validateTrigger = "change",
  normalize,
  getValueFromEvent,
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

  const f = form;

  const rulesSignature = JSON.stringify(rules ?? []);

  React.useEffect(() => {
    if (!name) return;
    const mergedRules = [...(rules || [])];
    if (required) mergedRules.unshift({ required: true });
    f.register(name, { rules: mergedRules });
    return () => {
      f.unregister(name);
    };
  }, [f, name, required, rulesSignature]);

  const value = name ? f.getFieldValue(name) : undefined;
  const errs = name ? f.getError(name) : undefined;
  const hasErr = !!(errs && errs.length > 0);

  const isValidChild = React.isValidElement(children);
  const childElement = isValidChild ? (children as React.ReactElement) : null;
  const valueExists =
    !!name && Object.prototype.hasOwnProperty.call(f.values, name);

  const { setFieldValue, setTouched, validateField, getFieldsValue } = f;

  const needChangeValidate = useMemo(
    () =>
      Array.isArray(validateTrigger)
        ? validateTrigger.includes("change")
        : validateTrigger === "change",
    [validateTrigger]
  );

  const needBlurValidate = useMemo(
    () =>
      Array.isArray(validateTrigger)
        ? validateTrigger.includes("blur")
        : validateTrigger === "blur",
    [validateTrigger]
  );

  const childProps = useMemo(() => {
    if (!name || !childElement) return null;

    const props: Record<string, unknown> = {};

    if (valueExists) {
      props[valuePropName] = value;
    }

    const originHandler = (childElement.props as Record<string, unknown>)[
      trigger
    ] as ((...args: unknown[]) => void) | undefined;

    const handleTrigger = (...args: unknown[]) => {
      originHandler?.(...args);
      let nextValue = getValueFromEvent
        ? getValueFromEvent(...args)
        : defaultGetValueFromEvent(valuePropName, ...args);
      const snapshot = getFieldsValue();
      snapshot[name] = nextValue;
      if (normalize) {
        nextValue = normalize(nextValue, snapshot);
      }
      void setFieldValue(name, nextValue, {
        validate: needChangeValidate,
        touch: true
      });
    };

    if (trigger === "onBlur") {
      props[trigger] = (...args: unknown[]) => {
        handleTrigger(...args);
        setTouched(name, true);
        if (needBlurValidate) {
          void validateField(name);
        }
      };
    } else {
      props[trigger] = handleTrigger;
      const originBlur = (childElement.props as Record<string, unknown>)
        .onBlur as ((...args: unknown[]) => void) | undefined;
      props.onBlur = (...args: unknown[]) => {
        originBlur?.(...args);
        setTouched(name, true);
        if (needBlurValidate) {
          void validateField(name);
        }
      };
    }

    if (hasErr) {
      if (!isIntrinsicElement(childElement)) {
        const currentStatus = (childElement.props as Record<string, unknown>)
          .status;
        if (currentStatus == null) {
          props.status = "error";
        }
      }
      props["aria-invalid"] = true;
      props["data-form-error"] = "true";
    }

    return props;
  }, [
    childElement,
    getFieldsValue,
    getValueFromEvent,
    hasErr,
    name,
    needBlurValidate,
    needChangeValidate,
    normalize,
    setFieldValue,
    setTouched,
    trigger,
    value,
    valueExists,
    valuePropName,
    validateField
  ]);

  const control = useMemo(() => {
    if (!childElement) return children;
    if (!childProps) return childElement;
    return React.cloneElement(childElement, childProps);
  }, [childElement, childProps, children]);

  const isHorizontal = f.layout === "horizontal";
  const showColon = typeof colon === "boolean" ? colon : f.colon !== false;

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
          {showColon ? ":" : ""}
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
      width: f.labelWidth
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

export function useForm(): React.MutableRefObject<FormInstance | null> {
  return React.useRef<FormInstance | null>(null);
}

export function useFormContext() {
  return useContext(FormContext);
}

export const Form = Object.assign(FormRoot, { Item: FormItem, useForm, useFormContext });

export default Form;
