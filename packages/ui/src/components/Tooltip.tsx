"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from "@floating-ui/react";
import { Text } from "@repo/ui";

import { useState, type ReactNode } from "react";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  placement?: Placement;
  disabled?: boolean;
};

export function Tooltip({
  children,
  content,
  placement = "top",
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(2), flip(), shift({ padding: 4 })],
  });

  const hover = useHover(context, { enabled: !disabled });
  const focus = useFocus(context, { enabled: !disabled });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const styleClasses = [
    "z-50 rounded-microPlus bg-tooltip-surface px-microPlus py-micro",
    "text-tooltip-content shadow-overlay-floating",
  ].join(" ");

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </span>
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={styleClasses}
          >
            <Text variant="input-helper-sm">{content}</Text>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
