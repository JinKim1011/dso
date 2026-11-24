import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

export type OverwritePrompt = Readonly<{
  isInteractive: () => boolean;
  confirm: (message: string) => Promise<boolean>;
}>;

export function createOverwritePrompt(
  input: NodeJS.ReadableStream & Partial<{ isTTY: boolean }> = process.stdin,
  output: NodeJS.WritableStream = process.stdout,
): OverwritePrompt {
  return {
    isInteractive: () => input.isTTY === true,
    confirm: (message) =>
      new Promise<boolean>((resolve) => {
        const readline = createInterface({
          input: input as Readable,
          output: output as Writable,
        });
        let settled = false;

        const finish = (accepted: boolean) => {
          if (settled) return;
          settled = true;
          readline.close();
          resolve(accepted);
        };

        readline.once("close", () => {
          if (!settled) {
            settled = true;
            resolve(false);
          }
        });

        readline.question(`${message} [y/N] `, (answer) => {
          const normalized = answer.trim().toLowerCase();
          finish(normalized === "y" || normalized === "yes");
        });
      }),
  };
}
