import type { TokenGraphViewModel } from "@/features/tokens/model/token-graph";
import { isCategory, isSupportedTokenKind } from "@repo/contracts/validation/enum";
import { isRecord } from "@repo/contracts/validation/operations/common";
import { parsePublishStagedChangesRequest } from "@repo/contracts/validation/operations/staged-changes";
import { tokenReferenceSlots } from "@repo/contracts/validation/token-reference-slots";
import { validateTokenValue } from "@repo/contracts/validation/token-value";

const STORAGE_VERSION = 2;
const PENDING_PUBLISH_STORAGE_VERSION = 1;
const LEGACY_STORAGE_KEY = "dso-workbench-staged-draft";
const STORAGE_PREFIX = `${LEGACY_STORAGE_KEY}:`;
const PENDING_PUBLISH_STORAGE_PREFIX = "dso-workbench-pending-publish:";

export type PersistedDraft = {
  version: 2;
  projectId: string;
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
};

export type PersistedPendingPublish = {
  version: 1;
  projectId: string;
  requestId: string;
  requestBody: string;
  requestBaseBody: string;
  submittedBaseModel: TokenGraphViewModel;
  submittedDraftModel: TokenGraphViewModel;
};

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId.toLowerCase()}`;
}

function pendingPublishStorageKey(projectId: string): string {
  return `${PENDING_PUBLISH_STORAGE_PREFIX}${projectId.toLowerCase()}`;
}

function isGraph(value: unknown): value is TokenGraphViewModel {
  if (
    !isRecord(value) ||
    typeof value.schemaVersion !== "number" ||
    !isRecord(value.root) ||
    value.root.id !== "root" ||
    typeof value.root.label !== "string" ||
    !Array.isArray(value.categories) ||
    !Array.isArray(value.tokenTypes)
  )
    return false;

  return (
    value.categories.every(
      (category) =>
        isRecord(category) &&
        typeof category.id === "string" &&
        isCategory(category.category) &&
        Array.isArray(category.tokenTypeIds) &&
        category.tokenTypeIds.every((id: unknown) => typeof id === "string"),
    ) &&
    value.tokenTypes.every(
      (type) =>
        isRecord(type) &&
        typeof type.id === "string" &&
        isCategory(type.category) &&
        typeof type.type === "string" &&
        isSupportedTokenKind(type.kind) &&
        Array.isArray(type.values) &&
        type.values.every((row: unknown) => {
          if (
            !isRecord(row) ||
            typeof row.id !== "string" ||
            typeof row.name !== "string" ||
            (row.cssVar !== undefined && typeof row.cssVar !== "string") ||
            (row.meta !== undefined && typeof row.meta !== "string") ||
            validateTokenValue(row.value).length > 0
          )
            return false;
          if (row.references === undefined) return true;
          if (!isRecord(row.references)) return false;
          return Object.entries(row.references).every(
            ([slot, id]) =>
              tokenReferenceSlots.some((supported) => supported === slot) &&
              typeof id === "string",
          );
        }),
    )
  );
}

export function clearPersistedDraftModel(projectId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(projectId));
  } catch (error) {
    console.warn("Failed to clear staged draft from local storage.", error);
  }
}

export function loadPersistedDraftModel(projectId: string): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== STORAGE_VERSION ||
      !("projectId" in parsed) ||
      typeof parsed.projectId !== "string" ||
      parsed.projectId.toLowerCase() !== projectId.toLowerCase() ||
      !("baseModel" in parsed) ||
      !isGraph(parsed.baseModel) ||
      !("draftModel" in parsed) ||
      !isGraph(parsed.draftModel)
    ) {
      throw new Error("Invalid staged draft was not restored or removed.");
    }
    return {
      version: STORAGE_VERSION,
      projectId: parsed.projectId,
      baseModel: parsed.baseModel,
      draftModel: parsed.draftModel,
    };
  } catch (error) {
    throw new Error("Failed to load staged draft from local storage.", { cause: error });
  }
}

export function discardLegacyDraft() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      parsed.version === 1
    ) {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      console.warn("Unrecognized legacy staged draft was not removed.");
    }
  } catch (error) {
    console.warn("Failed to inspect legacy staged draft.", error);
  }
}

export function persistDraftModel(
  projectId: string,
  baseModel: TokenGraphViewModel,
  draftModel: TokenGraphViewModel,
) {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedDraft = {
      version: STORAGE_VERSION,
      projectId,
      baseModel,
      draftModel,
    };
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist staged draft to local storage.", error);
  }
}

export function clearPersistedPendingPublish(projectId: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(pendingPublishStorageKey(projectId));
  } catch (error) {
    console.warn("Failed to clear pending publish from local storage.", error);
  }
}

export function persistPendingPublish(
  projectId: string,
  pending: Omit<PersistedPendingPublish, "version" | "projectId">,
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const payload: PersistedPendingPublish = {
      version: PENDING_PUBLISH_STORAGE_VERSION,
      projectId,
      ...pending,
    };

    window.localStorage.setItem(
      pendingPublishStorageKey(projectId),
      JSON.stringify(payload),
    );

    return true;
  } catch (error) {
    console.warn("Failed to persist pending publish to local storage.", error);

    return false;
  }
}

export function loadPersistedPendingPublish(
  projectId: string,
): PersistedPendingPublish | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(pendingPublishStorageKey(projectId));

    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== PENDING_PUBLISH_STORAGE_VERSION ||
      !("projectId" in parsed) ||
      typeof parsed.projectId !== "string" ||
      parsed.projectId.toLowerCase() !== projectId.toLowerCase() ||
      !("requestId" in parsed) ||
      typeof parsed.requestId !== "string" ||
      !("requestBody" in parsed) ||
      typeof parsed.requestBody !== "string" ||
      !("requestBaseBody" in parsed) ||
      typeof parsed.requestBaseBody !== "string" ||
      !("submittedBaseModel" in parsed) ||
      !isGraph(parsed.submittedBaseModel) ||
      !("submittedDraftModel" in parsed) ||
      !isGraph(parsed.submittedDraftModel)
    ) {
      throw new Error("Invalid pending publish was not restored or removed.");
    }

    const request = parsePublishStagedChangesRequest(JSON.parse(parsed.requestBody));

    if (
      !request.success ||
      request.value.requestId !== parsed.requestId ||
      request.value.projectId.toLowerCase() !== projectId.toLowerCase()
    ) {
      throw new Error("Invalid pending publish request body.");
    }

    return {
      version: PENDING_PUBLISH_STORAGE_VERSION,
      projectId: parsed.projectId,
      requestId: parsed.requestId,
      requestBody: parsed.requestBody,
      requestBaseBody: parsed.requestBaseBody,
      submittedBaseModel: parsed.submittedBaseModel,
      submittedDraftModel: parsed.submittedDraftModel,
    };
  } catch (error) {
    throw new Error("Failed to load pending publish from local storage.", {
      cause: error,
    });
  }
}
