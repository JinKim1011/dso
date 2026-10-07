import type { TokenGraphViewModel } from "@/_shared/models/tokenGraph";

const STAGED_DRAFT_STORAGE_VERSION = 1;
const STAGED_DRAFT_STORAGE_KEY = "dso-workbench-staged-draft";

type StagedDraftStoragePayload = {
  version: number;
  draftModel: TokenGraphViewModel;
};

export function clearPersistedDraftModel() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STAGED_DRAFT_STORAGE_KEY);
  } catch {}
}

export function loadPersistedDraftModel(): TokenGraphViewModel | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STAGED_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StagedDraftStoragePayload>;

    if (parsed.version !== STAGED_DRAFT_STORAGE_VERSION) {
      clearPersistedDraftModel();
      return null;
    }
    if (
      !parsed.draftModel ||
      typeof parsed.draftModel !== "object" ||
      !Array.isArray(parsed.draftModel.tokenTypes)
    ) {
      clearPersistedDraftModel();
      return null;
    }

    return parsed.draftModel as TokenGraphViewModel;
  } catch {
    return null;
  }
}

export function persistDraftModel(model: TokenGraphViewModel) {
  if (typeof window === "undefined") return;

  try {
    const payload: StagedDraftStoragePayload = {
      version: STAGED_DRAFT_STORAGE_VERSION,
      draftModel: model,
    };
    window.localStorage.setItem(STAGED_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
