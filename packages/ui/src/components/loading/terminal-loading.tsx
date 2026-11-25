import { cn } from "@repo/ui/lib/utils";

type TerminalProps = React.ComponentProps<"span"> & {
  prompt?: string;
  width?: string;
  height?: string;
};

function TerminalLoading({
  className,
  prompt = ">",
  width = "0.5em",
  height = "1em",
  style,
  ...props
}: TerminalProps) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-terminal-blink {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0;
          }
        }
      `}</style>
      <span
        role="status"
        className={cn("inline-flex items-center gap-[0.25em] font-mono", className)}
        style={style}
        {...props}
      >
        <span aria-hidden="true">{prompt}</span>
        <span
          aria-hidden="true"
          className="inline-block bg-current"
          style={{
            width,
            height,
            animation: "loading-ui-terminal-blink var(--duration, 1s) step-end infinite",
          }}
        />
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { TerminalLoading };
