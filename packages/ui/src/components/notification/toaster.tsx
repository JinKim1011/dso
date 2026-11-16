"use client";

import {
  CheckCircledIcon,
  ClockIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import type { CSSProperties, ReactElement } from "react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";

const defaultToastDuration = 4000;

const defaultToastStyle: CSSProperties = {
  backgroundColor: "var(--color-surface-primary)",
  borderColor: "var(--color-stroke-primary)",
  color: "var(--color-content-primary)",
  boxShadow: "var(--shadow-overlay-floating)",
  borderRadius: "var(--radius-micro)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-small)",
  fontWeight: "var(--font-regular)",
  lineHeight: "var(--leading-normal)",
};

const defaultToastClassNames: NonNullable<
  NonNullable<ToasterProps["toastOptions"]>["classNames"]
> = {
  description: "text-content-primary/50!",
};

const defaultToastIcons: NonNullable<ToasterProps["icons"]> = {
  success: <CheckCircledIcon className="size-3.5" />,
  info: <InfoCircledIcon className="size-3.5" />,
  warning: <ExclamationTriangleIcon className="size-3.5" />,
  error: <CrossCircledIcon className="size-3.5" />,
  loading: <ClockIcon className="size-3.5" />,
  close: <Cross2Icon className="size-3.5" />,
};

export const Toaster: ((props: ToasterProps) => ReactElement) & {
  toast: typeof toast;
} = Object.assign(
  function Toaster({ icons, toastOptions, ...props }: ToasterProps) {
    return (
      <SonnerToaster
        {...props}
        position={props.position ?? "bottom-right"}
        duration={props.duration ?? defaultToastDuration}
        icons={{ ...defaultToastIcons, ...icons }}
        toastOptions={{
          ...toastOptions,
          style: { ...defaultToastStyle, ...toastOptions?.style },
          classNames: { ...defaultToastClassNames, ...toastOptions?.classNames },
        }}
      />
    );
  },
  { toast },
);
