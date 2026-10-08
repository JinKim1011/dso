import { describe, expect, it } from "vitest";
import { manifestToDomain } from "./toDomain";
import { NormalizedManifestEntry } from "./types";

describe("manifestToDomain", () => {
  it("converts a scalar token", () => {
    const entries: NormalizedManifestEntry[] = [
      {
        category: "spacing",
        type: "step",
        kind: "primitive",
        value: ["small"],
        tokens: [
          {
            name: "small",
            cssVar: "--spacing-small",
            value: "0.5rem",
          },
        ],
      },
    ];

    const result = manifestToDomain(entries, {
      projectId: "project-1",
      releaseId: "release-1",
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0]?.value).toEqual({
      kind: "scalar",
      value: "0.5rem",
    });
  });

  it("converts mode-based values", () => {
    const entries: NormalizedManifestEntry[] = [
      {
        category: "color",
        type: "background",
        kind: "primitive",
        value: ["primary"],
        tokens: [
          {
            name: "primary",
            values: {
              light: "white",
              dark: "black",
            },
          },
        ],
      },
    ];

    const result = manifestToDomain(entries, {
      projectId: "project-1",
      releaseId: "release-1",
    });

    expect(result.tokens[0]?.value).toEqual({
      kind: "modes",
      light: "white",
      dark: "black",
    });
  });

  it("converts semantic typography values", () => {
    const entries: NormalizedManifestEntry[] = [
      {
        category: "typography",
        type: "TypographyVariant",
        kind: "semantic",
        value: ["body-md"],
        semanticMap: [
          {
            name: "body-md",
            fontSize: "regular",
            fontWeight: "regular",
            lineHeight: "normal",
          },
        ],
      },
    ];

    const result = manifestToDomain(entries, {
      projectId: "project-1",
      releaseId: "release-1",
    });

    expect(result.tokens[0]?.value).toEqual({
      kind: "typography",
      fontSize: "regular",
      fontWeight: "regular",
      lineHeight: "normal",
    });
  });

  it("rejects duplicate token types", () => {
    const entry: NormalizedManifestEntry = {
      category: "spacing",
      type: "step",
      kind: "primitive",
      value: ["small"],
    };

    expect(() =>
      manifestToDomain([entry, entry], {
        projectId: "project-1",
        releaseId: "release-1",
      }),
    ).toThrow("Duplicate token type");
  });
});
