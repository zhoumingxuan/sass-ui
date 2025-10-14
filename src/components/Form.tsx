"use client";

import React, {
  createContext,
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
  min?: number; // for number value or string length
  max?: number; // for number value or string length
  len?: number; // string length exact
  pattern?: RegExp;
  validator?: (
    value: unknown,
    values: Record<string, unknown>
  ) => string | void | Promise<string | void>;
};

type ValidateTrigger = "change" | "blur";

type FormContextType = {
  values: Record<string, unknown>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  register: (
    name: string,
    options: {
      rules?: Rule[];
      valuePropName?: string;
      validateTrigger?: ValidateTrigger | ValidateTrigger[];
    }
  ) => void;
  unregister: (name: string) => void;
  setValue: (
    name: string,
    value: unknown,
    opts?: { validate?: boolean }
  ) => Promise<string[] | undefined>;
  getValue: (name: string) => unknown;
  getError: (name: string) => string[] | undefined;
  validateField: (name: string) => Promise<string[]>;
  validateAll: () => Promise<Record<string, string[]>>;
  setTouched: (name: string, touched: boolean) => void;
  layout?: "vertical" | "horizontal";
  labelWidth?: number | string;
  colon?: boolean;
};

const FormContext = createContext<FormContextType | null>(null);

function useFormInternal(): FormContextType {
  const rulesRef = useRef<Record<string, Rule[] | undefined>>({});
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});

  const setTouched = useCallback((name: string, t: boolean) => {
    setTouchedState((prev) => ({ ...prev, [name]: t }));
  }, []);

  const register = useCallback(
    (name: string, options: { rules?: Rule[] }) => {
      rulesRef.current[name] = options.rules;
    },
    []
  );

  const unregister = useCallback((name: string) => {
    delete rulesRef.current[name];
    setValues((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setTouchedState((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
  }, []);

  const getValue = useCallback((name: string) => values[name], [values]);
  const getError = useCallback((name: string) => errors[name], [errors]);

  const runRules = useCallback(
    async (name: string, value: unknown) => {
      const r = rulesRef.current[name] || [];
      const res: string[] = [];
      for (const rule of r) {
        if (rule.required) {
          const empty =
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "") ||
            (Array.isArray(value) && value.length === 0);
          if (empty) {
            res.push(rule.message || "必填项");
            continue;
          }
        }
        if (typeof rule.len === "number" && typeof value === "string") {
          if ((value as string).length !== rule.len)
            res.push(rule.message || `长度必须为${rule.len}`);
        }
        if (typeof rule.min === "number") {
          if (typeof value === "number" && value < rule.min)
            res.push(rule.message || `不能小于${rule.min}`);
          if (typeof value === "string" && (value as string).length < rule.min)
            res.push(rule.message || `长度不能小于${rule.min}`);
        }
        if (typeof rule.max === "number") {
          if (typeof value === "number" && value > rule.max)
            res.push(rule.message || `不能大于${rule.max}`);
          if (typeof value === "string" && (value as string).length > rule.max)
            res.push(rule.message || `长度不能大于${rule.max}`);
        }
        if (rule.pattern && typeof value === "string") {
          if (!rule.pattern.test(value as string))
            res.push(rule.message || "格式不正确");
        }
        if (rule.validator) {
          const out = await rule.validator(value, values);
          if (typeof out === "string" && out) res.push(out);
        }
      }
      return res;
    },
    [values]
  );

  const setValue = useCallback(
    async (name: string, value: unknown, opts?: { validate?: boolean }) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (opts?.validate) {
        const errs = await runRules(name, value);
        setErrors((prev) => ({ ...prev, [name]: errs }));
        return errs;
      }
      return undefined;
    },
    [runRules]
  );

  const validateField = useCallback(
    async (name: string) => {
      const value = values[name];
      const errs = await runRules(name, value);
      setErrors((prev) => ({ ...prev, [name]: errs }));
      return errs;
    },
    [runRules, values]
  );

  const validateAll = useCallback(async () => {
    const all: Record<string, string[]> = {};
    const names = Object.keys(rulesRef.current);
    for (const n of names) {
      all[n] = await runRules(n, values[n]);
    }
    setErrors(all);
    return all;
  }, [runRules, values]);

  return {
    values,
    errors,
    touched,
    register,
    unregister,
    setValue,
    getValue,
    getError,
    validateField,
    validateAll,
    setTouched,
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
  labelWidth?: number | string; // for horizontal layout
  colon?: boolean; // show colon after label text
};

function FormRoot({
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
}: FormProps) {
  const api = useFormInternal();
  const mounted = useRef(false);

  // seed initial values once
  React.useEffect(() => {
    if (mounted.current) return;
    if (initialValues) {
      const names = Object.keys(initialValues);
      names.forEach((n) => {
        // 初始化不触发校验
        void api.setValue(n, initialValues[n]);
      });
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    onSubmit?.(e);
    e.preventDefault();
    const errs = await api.validateAll();
    const hasErr = Object.values(errs).some((arr) => (arr?.length || 0) > 0);
    if (hasErr) onFinishFailed?.({ values: api.values, errors: errs });
    else onFinish?.(api.values);
  };

  const ctx = useMemo(
    () => ({ ...api, layout, labelWidth, colon }),
    [api, layout, labelWidth, colon]
  );

  // 用 CSS 变量传递 label 宽度（仅 horizontal 生效）
  const labelStyleVar: React.CSSProperties | undefined =
    layout === "horizontal" && labelWidth != null
      ? ({
          ["--form-label-width" as any]:
            typeof labelWidth === "number" ? `${labelWidth}px` : labelWidth,
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
}

export type FormItemProps = {
  name?: string;
  label?: React.ReactNode;
  rules?: Rule[];
  required?: boolean;
  valuePropName?: string; // default 'value'; for Switch/Checkbox use 'checked'
  trigger?: string; // default 'onChange'
  validateTrigger?: ValidateTrigger | ValidateTrigger[]; // default 'change'
  normalize?: (value: unknown, values: Record<string, unknown>) => unknown;
  getValueFromEvent?: (...args: unknown[]) => unknown;
  help?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactElement;
  colon?: boolean; // override form colon
};

function defaultGetValueFromEvent(
  valuePropName: string,
  ...args: unknown[]
): unknown {
  if (!args || args.length === 0) return undefined;
  const first = args[0] as any;
  if (first && typeof first === "object" && "target" in first) {
    const t = (first as { target?: { checked?: boolean; value?: unknown } })
      .target;
    if (!t) return undefined;
    if (valuePropName === "checked") return t.checked;
    return t.value;
  }
  // 如果 onChange 以多参数形式返回（如日期范围），默认返回参数数组
  if (args.length > 1) return args;
  return args[0];
}

function isIntrinsicElement(el: React.ReactElement) {
  // 原生标签类型是字符串，例如 'input' | 'div'
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
  colon,
}: FormItemProps) {
  const form = useContext(FormContext);
  if (!form)
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );

  const f = form as FormContextType;

  React.useEffect(() => {
    if (!name) return;
    const r = [...(rules || [])];
    if (required) r.unshift({ required: true });
    f.register(name, { rules: r, valuePropName, validateTrigger });
    return () => {
      f.unregister(name);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, JSON.stringify(rules), required, valuePropName, JSON.stringify(validateTrigger)]);

  const val = name ? f.getValue(name) : undefined;
  const errs = name ? f.getError(name) : undefined;
  const hasErr = !!(errs && errs.length > 0);

  const child = children as React.ReactElement | undefined;
  const childProps: Record<string, unknown> = {};

  // 归一化校验触发设置
  const needChangeValidate = Array.isArray(validateTrigger)
    ? validateTrigger.includes("change")
    : validateTrigger === "change";
  const needBlurValidate = Array.isArray(validateTrigger)
    ? validateTrigger.includes("blur")
    : validateTrigger === "blur";

  if (name && child) {
    // 受控赋值
    childProps[valuePropName] = val;

    // 变更事件
    const origin = (child.props as Record<string, unknown>)[
      trigger
    ] as ((...a: unknown[]) => void) | undefined;
    (childProps as Record<string, unknown>)[trigger] = (...args: unknown[]) => {
      if (origin) origin(...args);
      let v = getValueFromEvent
        ? getValueFromEvent(...args)
        : defaultGetValueFromEvent(valuePropName, ...args);
      if (normalize) v = normalize(v, f.values);
      void f.setValue(name, v, { validate: needChangeValidate });
    };

    // 失焦校验
    const originBlur = (child.props as Record<string, unknown>)
      .onBlur as ((...a: unknown[]) => void) | undefined;
    (childProps as Record<string, unknown>).onBlur = (...args: unknown[]) => {
      if (originBlur) originBlur(...args);
      if (needBlurValidate) {
        void f.validateField(name);
      }
    };

    // 错误传递：仅对自定义组件透传 status，原生 DOM 使用 aria-invalid 避免未知属性警告
    if (hasErr) {
      if (!isIntrinsicElement(child)) {
        (childProps as Record<string, unknown>).status = "error";
      }
      (childProps as Record<string, unknown>)["aria-invalid"] = true;
      (childProps as Record<string, unknown>)["data-error"] = "true";
    }
  }

  const isHorizontal = f.layout === "horizontal";
  const showColon = typeof colon === "boolean" ? colon : f.colon !== false;

  const renderLabel = () => {
    if (!label) return null;
    const requiredMark =
      !!required ||
      (Array.isArray(rules) ? rules.some((r) => r && (r as Rule).required) : false);
    return (
      <div className={fieldLabel}>
        <span className="text-error mr-1">{requiredMark ? "*" : ""}</span>
        <span className="text-gray-700">
          {label}
          {showColon ? "：" : ""}
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
      width:f.labelWidth
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
            <div className="min-h-10 flex items-center">
              {child ? React.cloneElement(child, childProps) : null}
            </div>
            {renderHelp()}
          </div>
        </div>
      </div>
    );
  }

  // vertical
  return (
    <div className={["mb-3", className].join(" ")} style={style}>
      {renderLabel()}
      {child ? React.cloneElement(child, childProps) : null}
      {renderHelp()}
    </div>
  );
}

export function useForm() {
  // lightweight external instance with imperative helpers working via context
  const ctx = React.useContext(FormContext);
  return ctx;
}

export const Form = Object.assign(FormRoot, { Item: FormItem, useForm });

export default Form;
