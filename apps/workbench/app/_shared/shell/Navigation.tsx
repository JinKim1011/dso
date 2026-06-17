"use client";

import { DragHandleDots1Icon } from "@radix-ui/react-icons";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useLayoutEffect, useRef, useState } from "react";
import { workbenchNavigation } from "../../_config/navigation";
import { NavigationSlotDetailContext } from "../context/NavigationSlotContext";
import { useStagedManifest } from "../context/StagedManifestContext";

export function Navigation() {
  const path = usePathname();
  const navigationSlot = useContext(NavigationSlotDetailContext);
  const { changedRowCount } = useStagedManifest();
  const stagedCount = changedRowCount;

  const [slotHeight, setSlotHeight] = useState(0);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const node = elementRef.current;

    if (!node) {
      setSlotHeight(0);
      return;
    }

    if (!navigationSlot) {
      setSlotHeight(0);
      return;
    }

    const updateSize = () => {
      setSlotHeight(node.getBoundingClientRect().height);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [navigationSlot]);

  const tokensMenuItems = workbenchNavigation.filter((menu) => menu.id !== "staged");
  const stagedMenuItem = workbenchNavigation.filter((menu) => menu.id === "staged");

  const navWrapperStyles =
    "p-microPlus bg-surface-primary shadow-overlay-floating gap-mini flex-col items-center rounded-small h-fit ";
  const menuItemStyles =
    "rounded-mini p-mini text-content-quaternary duration-highlightFadeIn ease-outCubic hover:bg-surface-tertiary hover:text-content-primary aria-[current=page]:bg-surface-quaternary aria-[current=page]:text-content-primary inline-flex h-9 w-fit shrink-0 items-center justify-center bg-transparent transition-colors";

  const dragControl = useDragControls();

  return (
    <motion.div
      drag
      dragControls={dragControl}
      dragListener={false}
      dragElastic={0.04}
      dragMomentum={false}
      dragConstraints={{
        top: 0,
        left: -500,
        right: 500,
        bottom: 0,
      }}
      className="gap-microPlus fixed bottom-10 left-1/2 z-10 flex -translate-x-1/2 items-end"
    >
      <nav aria-label="navigation" className={navWrapperStyles}>
        <motion.div
          animate={{ height: slotHeight }}
          className="overflow-hidden"
          transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
        >
          <AnimatePresence>
            {navigationSlot ? (
              <motion.div
                ref={elementRef}
                key="navigationSlot"
                animate={{ opacity: 1 }}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.3 }}
              >
                <div
                  className="mr-mini text-content-quaternary/60 hover:text-content-primary top-miniPlus left-mini absolute flex cursor-grab items-center active:cursor-grabbing"
                  onPointerDown={(event) => {
                    dragControl.start(event);
                  }}
                >
                  <DragHandleDots1Icon className="size-4" />
                </div>
                {navigationSlot}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
        <div className="gap-micro inline-flex w-full justify-center p-0">
          {!navigationSlot && (
            <div
              className="mr-mini text-content-quaternary/60 hover:text-content-primary flex cursor-grab items-center active:cursor-grabbing"
              onPointerDown={(event) => {
                dragControl.start(event);
              }}
            >
              <DragHandleDots1Icon className="size-4" />
            </div>
          )}
          {tokensMenuItems.map((menu) => {
            const isActive = path === menu.href;
            const Icon = menu.icon;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-label={menu.id}
                aria-current={isActive ? "page" : undefined}
                className={menuItemStyles}
              >
                {Icon ? <Icon aria-hidden className="size-4.5 shrink-0" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>
      {!navigationSlot && (
        <nav aria-label="navigation" className={navWrapperStyles}>
          {stagedMenuItem.map((menu) => {
            const isActive = path === menu.href;
            const Icon = menu.icon;
            const displayLabel =
              menu.id === "staged" && stagedCount != null && stagedCount > 0
                ? String(stagedCount)
                : null;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-label={menu.id}
                aria-current={isActive ? "page" : undefined}
                className={menuItemStyles}
              >
                {Icon ? <Icon aria-hidden className="size-4.5 shrink-0" /> : null}
                {!menu.iconOnly ? displayLabel : null}
              </Link>
            );
          })}
        </nav>
      )}
    </motion.div>
  );
}
