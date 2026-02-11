export type SurfaceVariant = "primary" | "secondary" | "tertiary" | "quaternary";
export type ContentVariant = "primary" | "secondary" | "tertiary" | "quaternary";
export type StrokeVariant = "primary" | "secondary" | "tertiary";

export type SpacingStep = "micro" | "microPlus" | "mini" | "miniPlus" | "small" | "smallPlus" | "regular" | "regularPlus" | "large" | "largePlus";
export type FontSizeStep = "micro" | "microPlus" | "mini" | "miniPlus" | "small" | "smallPlus" | "regular" | "regularPlus" | "large" | "largePlus" | "title1" | "title2" | "title3";

export type DurationVariant = "highlightFadeIn" | "highlightFadeOut" | "quickTransition" | "regularTransition" | "slowTransition";
export type EaseVariant = | "inQuad" | "inCubic" | "inQuart" | "inQuint" | "inExpo" | "inCirc"
    | "outQuad" | "outCubic" | "outQuart" | "outQuint" | "outExpo" | "outCirc"
    | "inOutQuad" | "inOutCubic" | "inOutQuart" | "inOutQuint" | "inOutExpo" | "inOutCirc";

export type BgClass = `bg-surface-${SurfaceVariant}` | "bg-transparent";
export type TextColorClass = `text-content-${ContentVariant}` | "text-primary";
export type BorderClass = `border-stroke-${StrokeVariant}` | "border-transparent";

export type HoverBgClass = `hover:bg-surface-${SurfaceVariant}` | "hover:bg-transparent";
export type HoverTextClass = `hover:text-content-${ContentVariant}` | "hover:text-primary";
export type HoverBorderClass = `hover:border-stroke-${StrokeVariant}` | "hover:border-transparent";

export type ActiveBgClass = `active:bg-surface-${SurfaceVariant}` | "active:bg-transparent";
export type ActiveTextClass = `active:text-content-${ContentVariant}` | "active:text-primary";
export type ActiveBorderClass = `active:border-stroke-${StrokeVariant}` | "active:border-transparent";

export type PaddingClass = `p-${SpacingStep}` | "p-0";
export type PaddingXClass = `px-${SpacingStep}` | "px-0";
export type PaddingYClass = `py-${SpacingStep}` | "py-0";

export type MarginClass = `m-${SpacingStep}` | "m-0";
export type MarginXClass = `mx-${SpacingStep}` | "mx-0";
export type MarginYClass = `my-${SpacingStep}` | "my-0";

export type GapClass = `gap-${SpacingStep}`;

export type TextSizeClass = `text-${FontSizeStep}`;

export type SpeedClass = `duration-${DurationVariant}`;
export type EaseClass = `ease-${EaseVariant}`;

export const MotionSettings = {
    speed: {
        quick: .1,
        regular: .25,
        slow: .35
    },
    easing: {
        inQuad: [.55, .085, .68, .53],
        inCubic: [.55, .055, .675, .19],
        inQuart: [.895, .03, .685, .22],
        inQuint: [.755, .05, .855, .06],
        inExpo: [.95, .05, .795, .035],
        inCirc: [.6, .04, .98, .335],
        outQuad: [.25, .46, .45, .94],
        outCubic: [.215, .61, .355, 1],
        outQuart: [.165, .84, .44, 1],
        outQuint: [.23, 1, .32, 1],
        outExpo: [.19, 1, .22, 1],
        outCirc: [.075, .82, .165, 1],
        inOutQuad: [.455, .03, .515, .955],
        inOutCubic: [.645, .045, .355, 1],
        inOutQuart: [.77, 0, .175, 1],
        inOutQuint: [.86, 0, .07, 1],
        inOutExpo: [1, 0, 0, 1],
        inOutCirc: [.785, .135, .15, .86],
    }
} as const;