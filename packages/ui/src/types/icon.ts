import {
  CounterClockwiseClockIcon,
  TokensIcon,
  Component1Icon,
  LoopIcon,
  SunIcon,
  MoonIcon,
  LaptopIcon,
} from "@radix-ui/react-icons";

export const ICONS = {
  CounterClockwiseClock: CounterClockwiseClockIcon,
  Tokens: TokensIcon,
  Component1: Component1Icon,
  Loop: LoopIcon,
  Sun: SunIcon,
  Moon: MoonIcon,
  Laptop: LaptopIcon,
};

export type IconName = keyof typeof ICONS;
