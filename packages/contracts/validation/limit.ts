// provisional and defer final limits to the request-contract task.

export const CONTRACT_LIMITS = {
  identifier: 128,
  projectName: 200,
  projectSlug: 100,
  email: 320,
  password: 1_204,
  releaseVersion: 100,
  tokenName: 200,
  tokenValue: 10_000,
  cssVariable: 200,
  description: 5_000,
  documentPath: 500,
  templateContent: 100_000,
  collectionItems: 1_000,
  requestBodyBytes: 1_000_000,
} as const;

export type MaxLengthError = {
  code: "too-long";
  message: string;
};

export function validateMaxLength(
  value: string,
  fieldName: string,
  maximum: number,
): MaxLengthError | null {
  if (value.length > maximum) {
    return {
      code: "too-long",
      message: `${fieldName} cannot exceed ${maximum} characters.`,
    };
  }

  return null;
}
