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
import type {
  FormErrors,
  FormLayout,
  FormRule,
  FormSetValueOptions,
  FormSubmitFailedHandler,
  FormSubmitHandler,
  FormValidateTrigger,
  FormValue,
  FormValues
} from "./formTypes";

/** ======================= Form Instance & Context ======================= */
export type FormInstance<TValues extends FormValues = FormValues> = {
  setFieldValue: <Field extends keyof TValues & string>(
    name: Field,
    value: TValues[Field],
    opts?: FormSetValueOptions
  ) => Promise<string[] | undefined>;
  setFieldsValue: (
    values: Partial<TValues>,
    opts?: FormSetValueOptions
  ) => Promise<FormErrors>;
  getFieldValue: <Field extends keyof TValues & string>(name: Field) => TValues[Field];
  getFieldsValue: () => TValues;
  getError: (name: keyof TValues & string) => string[] | undefined;
  validateField: (name: keyof TValues & string) => Promise<string[]>;
  validateAll: () => Promise<FormErrors>;
  resetFieldsValue: (names?: (keyof TValues & string)[]) => void;
  hasFieldValue: (name: keyof TValues & string) => boolean;
};

type FormContextType<TValues extends FormValues = FormValues> = FormInstance<TValues> & {
  values: TValues;
  errors: FormErrors;
  register: (name: keyof TValues & string, options?: { rules?: FormRule[] }) => void;
  unregister: (name: keyof TValues & string) => void;
  layout?: FormLayout;
  labelWidth?: number | string;
  colon?: boolean;
};

const FormContext = createContext<FormContextType<FormValues> | null>(null);


const FULL_WIDTH_COLON = "\uFF1A";

const hasOwn = (obj: FormValues, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") return { ...(value as Record<string, unknown>) };
  return value;
}

function cloneInitialValues(initialValues?: Partial<FormValues>): FormValues {
  if (!initialValues) return {} as FormValues;
  const next: FormValues = {};
  Object.keys(initialValues).forEach((key) => {
    const val = cloneValue(initialValues[key]);
    if (val !== undefined) next[key] = val;
  });
  return next;
}

/** ======================= Core State & Validation ======================= */
function useFormInternal(initialValues?: Partial<FormValues>): Omit<
  FormContextType<FormValues>,
  "layout" | "labelWidth" | "colon"
> {
  const rulesRef = useRef<Record<string, FormRule[] | undefined>>({});
  const initialRef = useRef<FormValues>(cloneInitialValues(initialValues));
  const valuesRef = useRef<FormValues>(cloneInitialValues(initialValues));
  const [values, setValues] = useState<FormValues>(() => cloneInitialValues(initialValues));
  const [errors, setErrors] = useState<FormErrors>({});
  const hasFieldValueMap = useRef<Record<string, boolean>>({});

  const hasFieldValue = useCallback(
    (name: string) =>
      !!hasFieldValueMap.current[name] || hasOwn(valuesRef.current, name),
    []
  );

  const register = useCallback(
    (name: string, options?: { rules?: FormRule[] }) => {
      rulesRef.current[name] = options?.rules;
      if (hasOwn(valuesRef.current, name)) {
        hasFieldValueMap.current[name] = true;
      }
    },
    []
  );

  const unregister = useCallback((name: string) => {
    delete rulesRef.current[name];
    delete hasFieldValueMap.current[name];
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
    async (name: string, value: unknown, currentValues: FormValues) => {
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
          if (value.length !== rule.len) result.push(rule.message || `长度必须为${rule.len}`);
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
          if (!rule.pattern.test(value)) result.push(rule.message || "格式不正确");
        }
        if (rule.validator) {
          const message = await rule.validator(value, currentValues);
          if (typeof message === "string" && message) result.push(message);
        }
      }
      return result;
    },
    []
  );

  const getFieldValue = useCallback((name: string) => valuesRef.current[name], []);
  const getFieldsValue = useCallback(() => {
    const next: FormValues = {};
    Object.keys(valuesRef.current).forEach((key) => {
      next[key] = cloneValue(valuesRef.current[key]);
    });
    return next;
  }, []);
  const getError = useCallback((name: string) => errors[name], [errors]);

  const setFieldValue = useCallback(
    async (name: string, value: unknown, opts?: FormSetValueOptions) => {
      if (value === undefined) {
        const next = { ...valuesRef.current };
        if (hasOwn(next, name)) delete next[name];
        valuesRef.current = next;
        delete hasFieldValueMap.current[name];
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

      hasFieldValueMap.current[name] = true;
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
    [runRules]
  );

  const setFieldsValue = useCallback(
    async (incoming: FormValues, opts?: FormSetValueOptions) => {
      if (!incoming || Object.keys(incoming).length === 0) return {};
      const next = { ...valuesRef.current };
      Object.keys(incoming).forEach((key) => {
        const raw = incoming[key];
        if (raw === undefined) {
          if (hasOwn(next, key)) delete next[key];
          delete hasFieldValueMap.current[key];
          return;
        }
        hasFieldValueMap.current[key] = true;
        next[key] = cloneValue(raw);
      });
      valuesRef.current = next;
      setValues(next);
      if (opts?.validate) {
        const result: Record<string, string[]> = {};
        for (const key of Object.keys(incoming)) {
          const errs = await runRules(key, next[key], next);
          if (errs.length) result[key] = errs;
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
    [runRules]
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
      if (errs.length) result[name] = errs;
    }
    setErrors(result);
    return result;
  }, [runRules]);

  const resetFieldsValue = useCallback((names?: string[]) => {
    if (!names || names.length === 0) {
      const next = cloneInitialValues(initialRef.current);
      valuesRef.current = next;
      const nextHas: Record<string, boolean> = {};
      Object.keys(next).forEach((key) => {
        nextHas[key] = true;
      });
      hasFieldValueMap.current = nextHas;
      setValues(next);
      setErrors({});
      return;
    }
    const current = { ...valuesRef.current };
    names.forEach((name) => {
      if (hasOwn(initialRef.current, name)) {
        const init = cloneValue(initialRef.current[name]);
        if (init === undefined) {
          if (hasOwn(current, name)) delete current[name];
          delete hasFieldValueMap.current[name];
        } else {
          current[name] = init;
          hasFieldValueMap.current[name] = true;
        }
      } else {
        if (hasOwn(current, name)) delete current[name];
        delete hasFieldValueMap.current[name];
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

/** ======================= <Form /> Root ======================= */
export type FormProps<TValues extends FormValues = FormValues> =
  React.FormHTMLAttributes<HTMLFormElement> & {
    initialValues?: Partial<TValues>;
    onFinish?: FormSubmitHandler<TValues>;
    onFinishFailed?: FormSubmitFailedHandler<TValues>;
    layout?: FormLayout;
    labelWidth?: number | string;
    colon?: boolean;
  };

const FormRoot = forwardRef<FormInstance<FormValues>, FormProps>(function FormRoot(
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

  const contextValue = useMemo<FormContextType<FormValues>>(
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

/** ======================= <Form.Item /> ======================= */
export type FormItemProps = {
  name?: string;
  label?: React.ReactNode;
  rules?: FormRule[];
  required?: boolean;
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
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
    layout,
    labelWidth,
    colon: formColon
  } = form;

  // 注册/反注册 + required 合并
  const rulesSignature = JSON.stringify(rules ?? []);
  useEffect(() => {
    if (!name) return;
    const merged = [...(rules || [])];
    if (required) merged.unshift({ required: true });
    register(name, { rules: merged });
    return () => unregister(name);
  }, [name, register, unregister, required, rulesSignature]);

  const triggerList = Array.isArray(validateTrigger)
    ? validateTrigger
    : [validateTrigger ?? "blur"];
  const needChangeValidate = triggerList.includes("change");
  const needBlurValidate = triggerList.includes("blur");

  // 读仓库值 & 错误

  const errs = name ? getError(name) : undefined;
  const hasErr = !!(errs && errs.length > 0);

  // ============ 克隆子节点 ============
  const childElement = React.isValidElement(children)
    ? (children as React.ReactElement)
    : null;

  const childOriginalProps = childElement
    ? (childElement.props as Record<string, unknown>)
    : undefined;

  // 稳定 handlers（仅依赖必要键）
  const handleChange = useCallback(
    (value: FormValue) => {
      console.log("onChange:",value);
      if (!name) return;
      const fieldName = name;
      void setFieldValue(fieldName, value, {
        validate: needChangeValidate
      });
      // 透传原始 onChange
      const orig = childOriginalProps?.onChange as
        | ((v: FormValue) => void)
        | undefined;
      if (typeof orig === "function") orig(value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, needChangeValidate, setFieldValue, childOriginalProps?.onChange]
  );

  const handleBlur = useCallback(
    (...args: unknown[]) => {
      if (name && needBlurValidate) void validateField(name);
      const orig = childOriginalProps?.onBlur as
        | ((...args: unknown[]) => void)
        | undefined;
      if (typeof orig === "function") orig(...args);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, needBlurValidate, validateField, childOriginalProps?.onBlur]
  );


  // 用 useMemo 稳定 childProps（仅在真正变动时变）
  const childProps = useMemo(() => {
    const storeValue = name ? getFieldValue(name) : undefined;
    // 始终提供“已定义”的受控值；防止 uncontrolled→controlled
    const safeValue = storeValue === undefined ? "" : storeValue;
    const base: Record<string, unknown> = {
      value: safeValue,
      onChange: handleChange,
      onBlur: handleBlur
    };
    if (hasErr) {
      base.status = "error"; // 自定义组件可读
      base["aria-invalid"] = true;
      base["data-form-error"] = "true";
    }
    return base;
  }, [getFieldValue, handleBlur, handleChange, hasErr, name]);

  let control: React.ReactNode = childElement ?? children;
  if (name && childElement) {
    control = React.cloneElement(childElement, childProps);
  }

  // ============ 布局与提示 ============
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

  const renderFeedback = () => {
    if (hasErr) return <div className={errorText}>{errs![0]}</div>;
    const node = help ?? extra;
    return node ? <div className={helperText}>{node}</div> : null;
  };

  if (isHorizontal) {
    return (
      <div className={["mb-3", className].join(" ")} style={style}>
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 text-right flex items-center justify-end min-h-10"
            style={{ width: labelWidth }}
          >
            {renderLabel()}
          </div>
          <div className="flex-1">
            <div className="min-h-10 flex items-center">{control}</div>
            {renderFeedback()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={["mb-3", className].join(" ")} style={style}>
      {renderLabel()}
      {control}
      {renderFeedback()}
    </div>
  );
}

/** ======================= Hooks & Exports ======================= */
export function useForm<TValues extends FormValues = FormValues>() {
  return React.useRef<FormInstance<TValues> | null>(null);
}

export function useFormContext<TValues extends FormValues = FormValues>() {
  return useContext(FormContext) as FormContextType<TValues> | null;
}

export const Form = Object.assign(FormRoot, { Item: FormItem, useForm, useFormContext });

export default Form;
