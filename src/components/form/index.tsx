"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { fieldLabel, helperText, errorText } from "../formStyles";

type Rule = {
  required?: boolean;
  message?: string;
  min?: number; // for number value or string length
  max?: number; // for number value or string length
  len?: number; // string length exact
  pattern?: RegExp;
  validator?: (value: any, values: Record<string, any>) => string | void | Promise<string | void>;
};

type ValidateTrigger = "change" | "blur";

type FormContextType = {
  values: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  register: (name: string, options: { rules?: Rule[]; valuePropName?: string; validateTrigger?: ValidateTrigger | ValidateTrigger[] }) => void;
  unregister: (name: string) => void;
  setValue: (name: string, value: any, opts?: { validate?: boolean }) => Promise<string[] | undefined>;
  getValue: (name: string) => any;
  getError: (name: string) => string[] | undefined;
  validateField: (name: string) => Promise<string[]>;
  validateAll: () => Promise<Record<string, string[]>>;
  setTouched: (name: string, touched: boolean) => void;
  layout?: 'vertical' | 'horizontal';
  labelWidth?: number | string;
};

const FormContext = createContext<FormContextType | null>(null);

function useFormInternal() {
  const rulesRef = useRef<Record<string, Rule[] | undefined>>({});
  const triggersRef = useRef<Record<string, ValidateTrigger | ValidateTrigger[] | undefined>>({});
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});

  const setTouched = useCallback((name: string, t: boolean) => {
    setTouchedState((prev) => ({ ...prev, [name]: t }));
  }, []);

  const register = useCallback((name: string, options: { rules?: Rule[]; valuePropName?: string; validateTrigger?: ValidateTrigger | ValidateTrigger[] }) => {
    rulesRef.current[name] = options.rules;
    triggersRef.current[name] = options.validateTrigger;
  }, []);

  const unregister = useCallback((name: string) => {
    delete rulesRef.current[name];
    delete triggersRef.current[name];
    setValues((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
    setErrors((prev) => {
      const n = { ...prev } as Record<string, string[]>;
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

  const runRules = useCallback(async (name: string, value: any) => {
    const r = rulesRef.current[name] || [];
    const res: string[] = [];
    for (const rule of r) {
      if (rule.required) {
        const empty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0);
        if (empty) { res.push(rule.message || '必填项'); continue; }
      }
      if (typeof rule.len === 'number' && typeof value === 'string') {
        if (value.length !== rule.len) res.push(rule.message || `长度必须为${rule.len}`);
      }
      if (typeof rule.min === 'number') {
        if (typeof value === 'number' && value < rule.min) res.push(rule.message || `不能小于${rule.min}`);
        if (typeof value === 'string' && value.length < rule.min) res.push(rule.message || `长度不能小于${rule.min}`);
      }
      if (typeof rule.max === 'number') {
        if (typeof value === 'number' && value > rule.max) res.push(rule.message || `不能大于${rule.max}`);
        if (typeof value === 'string' && value.length > rule.max) res.push(rule.message || `长度不能大于${rule.max}`);
      }
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) res.push(rule.message || '格式不正确');
      }
      if (rule.validator) {
        const out = await rule.validator(value, values);
        if (typeof out === 'string' && out) res.push(out);
      }
    }
    return res;
  }, [values]);

  const setValue = useCallback(async (name: string, value: any, opts?: { validate?: boolean }) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (opts?.validate) {
      const errs = await runRules(name, value);
      setErrors((prev) => ({ ...prev, [name]: errs }));
      return errs;
    }
    return undefined;
  }, [runRules]);

  const validateField = useCallback(async (name: string) => {
    const value = values[name];
    const errs = await runRules(name, value);
    setErrors((prev) => ({ ...prev, [name]: errs }));
    return errs;
  }, [runRules, values]);

  const validateAll = useCallback(async () => {
    const all: Record<string, string[]> = {};
    const names = Object.keys(rulesRef.current);
    for (const n of names) {
      all[n] = await runRules(n, values[n]);
    }
    setErrors(all);
    return all;
  }, [runRules, values]);

  return { values, errors, touched, register, unregister, setValue, getValue, getError, validateField, validateAll, setTouched } as FormContextType;
}

export type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  initialValues?: Record<string, any>;
  onFinish?: (values: Record<string, any>) => void;
  onFinishFailed?: (opts: { values: Record<string, any>; errors: Record<string, string[]> }) => void;
  layout?: 'vertical' | 'horizontal';
  labelWidth?: number | string; // for horizontal layout
  colon?: boolean; // show colon after label text
};

function FormRoot({ initialValues, onFinish, onFinishFailed, layout = 'vertical', labelWidth, colon = true, className = '', onSubmit, children, ...rest }: FormProps) {
  const api = useFormInternal();
  const mounted = useRef(false);

  // seed initial values once
  React.useEffect(() => {
    if (mounted.current) return;
    if (initialValues) {
      const names = Object.keys(initialValues);
      names.forEach((n) => api.setValue(n, initialValues[n]));
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

  const ctx = useMemo(() => ({ ...api, layout, labelWidth, colon }), [api, layout, labelWidth, colon]);

  return (
    <FormContext.Provider value={ctx}>
      <form onSubmit={handleSubmit} className={[layout === 'horizontal' ? 'space-y-3' : 'space-y-3', className].join(' ')} {...rest}>
        <div style={layout === 'horizontal' ? { ['--form-label-width' as any]: typeof labelWidth === 'number' ? `${labelWidth}px` : labelWidth } : undefined}>
          {children}
        </div>
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
  normalize?: (value: any, values: Record<string, any>) => any;
  getValueFromEvent?: (...args: any[]) => any;
  help?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactElement;
  colon?: boolean; // override form colon
};

function defaultGetValueFromEvent(valuePropName: string, ...args: any[]) {
  if (!args || args.length === 0) return undefined;
  const first = args[0];
  if (first && typeof first === 'object' && 'target' in first) {
    const t = (first as any).target;
    if (valuePropName === 'checked') return t.checked;
    return t.value;
  }
  // 如果 onChange 以多参数形式返回（如日期范围），默认返回参数数组
  if (args.length > 1) return args;
  return first;
}

function FormItem({
  name,
  label,
  rules,
  required,
  valuePropName = 'value',
  trigger = 'onChange',
  validateTrigger = 'change',
  normalize,
  getValueFromEvent,
  help,
  extra,
  className = '',
  style,
  children,
  colon,
}: FormItemProps) {
  const form = useContext(FormContext);
  if (!form) return <div className={className} style={style}>{children}</div>;

  // register/unregister
  React.useEffect(() => {
    if (!name) return;
    const r = [...(rules || [])];
    if (required) r.unshift({ required: true });
    form.register(name, { rules: r, valuePropName, validateTrigger });
    return () => { form.unregister(name); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, JSON.stringify(rules), required, valuePropName, JSON.stringify(validateTrigger)]);

  const val = name ? form.getValue(name) : undefined;
  const errs = name ? form.getError(name) : undefined;
  const hasErr = !!(errs && errs.length > 0);

  const child = children as React.ReactElement | undefined;
  const childProps: Record<string, any> = {};

  if (name && child) {
    childProps[valuePropName] = val;

    const origin = (child.props as any)[trigger];
    childProps[trigger] = (...args: any[]) => {
      if (origin) origin(...args);
      let v = getValueFromEvent ? getValueFromEvent(...args) : defaultGetValueFromEvent(valuePropName, ...args);
      if (normalize) v = normalize(v, form.values);
      form.setValue(name, v, { validate: Array.isArray(validateTrigger) ? validateTrigger.includes('change') : validateTrigger === 'change' });
    };

    // blur validation
    const originBlur = (child.props as any).onBlur;
    childProps.onBlur = (...args: any[]) => {
      if (originBlur) originBlur(...args);
      if (Array.isArray(validateTrigger) ? validateTrigger.includes('blur') : validateTrigger === 'blur') {
        if (name) form.validateField(name);
      }
    };
  }

  const isHorizontal = form.layout === 'horizontal';
  const showColon = typeof colon === 'boolean' ? colon : (form as any).colon !== false;
  const renderLabel = () => {
    if (!label) return null;
    const txt = typeof label === 'string' ? label : label;
    return (
      <div className={fieldLabel}>
        <span className="text-error mr-1">{required ? '*' : ''}</span>
        <span className="text-gray-700">{txt}{showColon ? '：' : ''}</span>
      </div>
    );
  };
  if (isHorizontal) {
    const labelBoxStyle: React.CSSProperties = { width: typeof form.labelWidth === 'number' ? `${form.labelWidth}px` : form.labelWidth };
    return (
      <div className={["mb-3", className].join(' ')} style={style}>
        <div className="flex items-center gap-4">
          <div className="shrink-0 text-right flex items-center justify-end min-h-10" style={labelBoxStyle}>
            {renderLabel()}
          </div>
          <div className="flex-1">
            {child ? React.cloneElement(child, childProps) : null}
            {hasErr ? (
              <div className={errorText}>{errs![0]}</div>
            ) : (
              help ? <div className={helperText}>{help}</div> : extra ? <div className={helperText}>{extra}</div> : null
            )}
          </div>
        </div>
      </div>
    );
  }
  // vertical
  return (
    <div className={["mb-3", className].join(' ')} style={style}>
      {renderLabel()}
      {child ? React.cloneElement(child, childProps) : null}
      {hasErr ? (
        <div className={errorText}>{errs![0]}</div>
      ) : (
        help ? <div className={helperText}>{help}</div> : extra ? <div className={helperText}>{extra}</div> : null
      )}
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
