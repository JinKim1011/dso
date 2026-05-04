import { Component1Icon, LoopIcon, TokensIcon } from "@radix-ui/react-icons";

type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export type WorkbenchNavigationItem = {
  id: "tokens" | "schema" | "staged";
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
    id: "schema",
    href: "/schema",
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
