import {
  ColorWheelIcon,
  CornersIcon,
  FrameIcon,
  ShadowIcon,
  TextIcon,
  TransformIcon,
} from "@radix-ui/react-icons";

type IconComponent = React.ElementType<{
  className?: string;
  "aria-hidden"?: boolean;
}>;

export type TokenNavigationItem = {
  id: "color" | "typography" | "spacing" | "radius" | "shadow" | "motion";
  href: string;
  iconOnly: boolean;
  icon: IconComponent;
};

export const tokenNavigationItems: TokenNavigationItem[] = [
  {
    id: "color",
    href: "/tokens/color",
    iconOnly: true,
    icon: ColorWheelIcon,
  },
  {
    id: "typography",
    href: "/tokens/typography",
    iconOnly: true,
    icon: TextIcon,
  },
  {
    id: "spacing",
    href: "/tokens/spacing",
    iconOnly: true,
    icon: FrameIcon,
  },
  {
    id: "radius",
    href: "/tokens/radius",
    iconOnly: true,
    icon: CornersIcon,
  },
  {
    id: "shadow",
    href: "/tokens/shadow",
    iconOnly: true,
    icon: ShadowIcon,
  },
  {
    id: "motion",
    href: "/tokens/motion",
    iconOnly: true,
    icon: TransformIcon,
  },
];
