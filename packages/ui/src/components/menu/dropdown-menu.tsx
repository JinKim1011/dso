"use client";

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  type Placement,
} from "@floating-ui/react";
import { useRef, useState } from "react";
import { Button, type IconComponent } from "../Button";
import { MenuItem } from "./menu-item";

type DropdownMenuProps = {
  label: string;
  items: MenuItem[];
  placement?: Placement;
  rightIcon?: IconComponent;
};

export function DropdownMenu({
  label,
  items,
  placement = "bottom-start",
  rightIcon,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const disabledIndices = items.flatMap((item, index) =>
    item.type === "info" || item.disabled ? [index] : [],
  );

  const firstEnabledIndex = items.findIndex(
    (item) => item.type === "action" && !item.disabled,
  );

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: "fixed",
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "menu" });
  const navigation = useListNavigation(context, {
    listRef: itemRefs,
    activeIndex,
    onNavigate: setActiveIndex,
    disabledIndices,
    focusItemOnOpen: true,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    navigation,
  ]);

  return (
    <>
      <Button
        ref={refs.setReference}
        {...getReferenceProps()}
        variant="void"
        size="md"
        label={label}
        rightIcon={rightIcon}
        className="active:translate-y-0 active:scale-100"
      />
      {open && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={firstEnabledIndex < 0 ? -1 : 0}
          >
            <div
              ref={refs.setFloating}
              {...getFloatingProps()}
              style={floatingStyles}
              className="py-microPlus px-micro rounded-mini shadow-overlay-menu bg-surface-secondary z-50 min-w-48"
            >
              {items.map((item, index) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  buttonRef={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  tabIndex={
                    activeIndex === index ||
                    (activeIndex === null && index === firstEnabledIndex)
                      ? 0
                      : -1
                  }
                  {...getItemProps({
                    onClick: () => {
                      if (item.type !== "action") return;
                      item.onSelect();
                      if (item.closeOnSelect !== false) setOpen(false);
                    },
                  })}
                />
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
