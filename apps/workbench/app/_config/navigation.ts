import { Component1Icon, LoopIcon, TokensIcon } from "@radix-ui/react-icons";
import { IconComponent } from "../../../../packages/ui/src/components/Button";

export type WorkbenchNavigationItem = {
  id: "tokens" | "preview" | "staged";
  href: string;
  iconOnly: boolean;
  icon: IconComponent;
};

export const workbenchNavigation: WorkbenchNavigationItem[] = [
  {
    id: "tokens",
    href: "/tokens",
    iconOnly: true,
    icon: TokensIcon,
  },
  {
    id: "preview",
    href: "/preview",
    iconOnly: true,
    icon: Component1Icon,
  },
  {
    id: "staged",
    href: "/staged",
    iconOnly: false,
    icon: LoopIcon,
  },
];
