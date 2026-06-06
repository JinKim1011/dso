import {
  ColorWheelIcon,
  Component1Icon,
  LoopIcon,
  TextIcon,
} from "@radix-ui/react-icons";

type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export type WorkbenchNavigationItem = {
  id: "color" | "typography" | "schema" | "staged";
  href: string;
  iconOnly: boolean;
  icon: IconComponent;
};

export const workbenchNavigation: WorkbenchNavigationItem[] = [
  {
    id: "color",
    href: "/tokens/color",
    iconOnly: true,
    icon: ColorWheelIcon,
  },
  {
    id: "color",
    href: "/tokens/typography",
    iconOnly: true,
    icon: TextIcon,
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
