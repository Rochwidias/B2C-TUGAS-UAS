"use client";

import React, { useId, useRef, useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "soft";

const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-accent to-cyan text-bg font-semibold shadow-[0_0_32px_-8px_var(--color-accent-glow)] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_rgba(232,93,4,0.5)] active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed",
  secondary:
    "border-2 border-accent bg-transparent text-accent hover:bg-accent-soft active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  outline:
    "border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-bg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "border-2 border-transparent bg-transparent text-ink-muted hover:bg-bg-alt hover:text-ink active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "border-2 border-error bg-transparent text-error hover:bg-error hover:text-bg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  soft:
    "border-2 border-transparent bg-accent-soft text-accent hover:bg-accent hover:text-bg active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
};

const buttonSizes = {
  sm: "px-4 py-1.5 text-caption gap-1.5",
  md: "px-5 py-2.5 text-body-sm gap-2",
  lg: "px-7 py-3 text-body gap-2.5",
  xl: "px-9 py-4 text-body-lg gap-3",
};

const baseButton =
  "inline-flex items-center justify-center font-display rounded-full transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof buttonSizes;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  children,
  asChild = false,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  const buttonClassName = cn(
    baseButton,
    buttonVariants[variant],
    buttonSizes[size],
    fullWidth && "w-full",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string;
      children?: ReactNode;
    }>;
    return React.cloneElement(child, {
      className: cn(buttonClassName, child.props.className),
      children: child.props.children,
    });
  }

  return (
    <button
      className={buttonClassName}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memproses…</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="shrink-0" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
};

Button.displayName = "Button";

const fieldBase =
  "w-full rounded-xl border-2 bg-surface px-4 py-3 text-body text-ink placeholder-ink-soft outline-none transition-all duration-150 " +
  "border-transparent ring-1 ring-line hover:ring-line-strong " +
  "focus:border-accent focus:ring-2 focus:ring-accent/25 focus:bg-bg " +
  "disabled:bg-bg-alt disabled:text-ink-muted disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/25";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = ({
  className,
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  ...props
}: InputProps) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-display text-body-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(fieldBase, leftIcon && "pl-12", rightIcon && "pr-12", className)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(errorId, hintId)}
          {...props}
        />
        {rightIcon && (
          <div
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          >
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1 text-caption text-error"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
};

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = ({
  className,
  label,
  error,
  hint,
  id,
  ...props
}: TextareaProps) => {
  const generatedId = useId();
  const inputId = id || `textarea-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block font-display text-body-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(fieldBase, "min-h-[120px] resize-y", className)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={cn(errorId, hintId)}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1 text-caption text-error"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
};

Textarea.displayName = "Textarea";

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = ({
  className,
  label,
  error,
  hint,
  options,
  placeholder,
  id,
  onChange,
  ...props
}: SelectProps) => {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block font-display text-body-sm font-medium text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(fieldBase, "appearance-none pr-11", className)}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(errorId, hintId)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-center gap-1 text-caption text-error"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  );
};

Select.displayName = "Select";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = ({ className, ...props }: LabelProps) => {
  return (
    <label
      className={cn(
        "mb-1.5 block font-display text-body-sm font-medium text-ink",
        className,
      )}
      {...props}
    />
  );
};

Label.displayName = "Label";

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "category" | "status" | "price" | "new" | "sale" | "playful";
  color?: string;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  className,
  variant = "default",
  color,
  size = "md",
  dot = false,
  style,
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-micro",
    md: "px-3 py-1 text-caption",
    lg: "px-4 py-2 text-body-sm",
  };

  const variantClasses: Record<string, string> = {
    default: "bg-bg-alt text-ink-muted",
    category: "text-bg font-bold",
    status: "font-medium normal-case tracking-normal",
    price: "bg-ink text-bg font-semibold shadow-pill",
    new: "bg-accent text-bg font-semibold",
    sale: "bg-error text-bg font-semibold",
    playful: "bg-butter-soft text-ink font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-display uppercase tracking-[0.05em]",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      style={
        variant === "category" && color
          ? { backgroundColor: color, ...style }
          : style
      }
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

Badge.displayName = "Badge";

export interface AlertProps {
  children: ReactNode;
  className?: string;
  tone?: "error" | "success" | "info" | "warning";
  icon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  children,
  className,
  tone = "error",
  icon = true,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const tones = {
    error: "border-error/25 bg-error-soft text-error",
    success: "border-success/25 bg-success-soft text-success",
    info: "border-info/25 bg-info-soft text-info",
    warning: "border-warning/25 bg-warning-soft text-warning",
  } as const;

  return (
    <div
      className={cn(
        "relative rounded-xl border px-4 py-3.5 text-body-sm",
        tones[tone],
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {icon && (
          <svg
            className="mt-0.5 h-5 w-5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 10-2 0v6a1 1 0 102 0V5z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5"
            aria-label="Tutup notifikasi"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

Alert.displayName = "Alert";

export interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  centered?: boolean;
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  centered = false,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between",
        centered && "items-center text-center sm:flex-col",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-2", centered && "items-center")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="text-balance font-display text-display-sm leading-tight sm:text-display-md">
          {title}
        </h2>
        {subtitle && (
          <p className="max-w-xl text-pretty text-body-lg leading-relaxed text-ink-muted">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-4 shrink-0 sm:mt-0">{action}</div>}
    </div>
  );
}

SectionTitle.displayName = "SectionTitle";

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined" | "interactive" | "glass" | "organic";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  hover = false,
  style,
}: CardProps) {
  const variantClasses = {
    default: "border border-line bg-surface shadow-card",
    elevated: "border border-transparent bg-surface shadow-card",
    outlined: "border-2 border-line-strong bg-transparent",
    interactive:
      "border border-line bg-surface shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/30 hover:shadow-card-hover",
    glass: "border border-accent/10 bg-white/80 backdrop-blur-xl",
    organic:
      "border-2 border-transparent bg-gradient-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover",
  };

  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-6 sm:p-8",
    xl: "p-8 sm:p-10",
  };

  return (
    <div
      className={cn(
        "rounded-2xl",
        variantClasses[variant],
        paddingClasses[padding],
        hover && "transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

Card.displayName = "Card";

export interface DividerProps {
  className?: string;
  text?: string;
  orientation?: "horizontal" | "vertical";
}

export function Divider({
  className,
  text,
  orientation = "horizontal",
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("h-full w-px bg-line", className)}
        aria-hidden="true"
      />
    );
  }

  if (text) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <div className="h-px flex-1 bg-line" aria-hidden="true" />
        <span className="font-display text-micro font-semibold uppercase tracking-[0.2em] text-ink-muted">
          {text}
        </span>
        <div className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
    );
  }

  return <hr className={cn("border-line", className)} aria-hidden="true" />;
}

Divider.displayName = "Divider";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  shape?: "circle" | "square";
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
  shape = "circle",
}: AvatarProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-micro",
    sm: "h-8 w-8 text-caption",
    md: "h-10 w-10 text-body-sm",
    lg: "h-12 w-12 text-body",
    xl: "h-16 w-16 text-body-lg",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden font-medium",
        sizeClasses[size],
        shape === "circle" ? "rounded-full" : "rounded-xl",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover"
          aria-hidden={!!fallback}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-bg-alt text-ink-muted" aria-hidden="true">
          {fallback}
        </div>
      )}
    </div>
  );
}

Avatar.displayName = "Avatar";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="animate-shimmer h-4 rounded bg-gradient-to-r from-bg-dim via-bg-alt to-bg-dim"
            style={{
              width: i === lines - 1 && width ? width : "100%",
              maxWidth: "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "animate-shimmer rounded-xl bg-gradient-to-r from-bg-dim via-bg-alt to-bg-dim",
        variant === "circular" && "rounded-full",
        className,
      )}
      style={{
        width: width || "100%",
        height: height || "1rem",
      }}
    />
  );
}

Skeleton.displayName = "Skeleton";

export interface TabsProps {
  items: { value: string; label: string; icon?: ReactNode; count?: number }[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: "line" | "pills" | "segmented";
}

export function Tabs({
  items,
  activeValue,
  onChange,
  className,
  variant = "line",
}: TabsProps) {
  const variants = {
    line: "border-b border-line",
    pills: "gap-1 rounded-full bg-bg-alt p-1",
    segmented: "gap-0 rounded-full bg-bg-alt p-1",
  };

  const itemVariants = {
    line: "border-b-2 border-transparent -mb-px px-4 py-3 text-body-sm font-medium transition-colors hover:border-accent/30 hover:text-ink",
    pills:
      "rounded-full px-4 py-2 text-body-sm font-medium transition-all",
    segmented:
      "rounded-full px-4 py-2 text-body-sm font-medium transition-all",
  };

  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn("flex items-center", variants[variant], className)}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={activeValue === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            itemVariants[variant],
            "relative flex items-center gap-2 whitespace-nowrap",
            variant !== "line" &&
              (activeValue === item.value
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"),
            variant === "line" &&
              activeValue === item.value &&
              "border-accent text-accent",
          )}
        >
          {item.icon && (
            <span className="shrink-0" aria-hidden="true">
              {item.icon}
            </span>
          )}
          {item.label}
          {item.count !== undefined && (
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-micro font-semibold",
                activeValue === item.value
                  ? "bg-accent text-bg"
                  : "bg-bg-dim text-ink-muted",
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

Tabs.displayName = "Tabs";

export interface TabPanelProps {
  value: string;
  activeValue: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({
  value,
  activeValue,
  children,
  className,
}: TabPanelProps) {
  if (activeValue !== value) return null;

  return (
    <div role="tabpanel" className={cn("animate-fade-in", className)}>
      {children}
    </div>
  );
}

TabPanel.displayName = "TabPanel";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 200,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setVisible(true), delay);
  };
  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-lg bg-ink px-3 py-2 font-display text-caption font-medium text-bg shadow-card animate-scale-in",
            positions[position],
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}

Tooltip.displayName = "Tooltip";
