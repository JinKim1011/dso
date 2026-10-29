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
  componentName: 200,
  componentDescriptions: 5_000,
  documentPath: 500,
  templateName: 200,
  templateContent: 100_000,
  collectionItems: 1_000,
  requestBodyBytes: 1_000_000,
} as const;

export type MaxLengthError = {
  code: "too-long";
  message: string;
};

export type CollectionLimitError = {
  code: "too-many-items";
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

export function validateCollectionSize(
  value: unknown,
  fieldName: string,
  maximum: number,
): CollectionLimitError | null {
  if (!Array.isArray(value)) {
    return null;
  }

  if (value.length > maximum) {
    return {
      code: "too-many-items",
      message: `${fieldName} cannot contain more than ${maximum} items.`,
    };
  }
  return null;
}
