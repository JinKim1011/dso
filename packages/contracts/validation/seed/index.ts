import type { SeedData } from "@repo/contracts/seed";
import {
  findDuplicateIds,
  validateSeedCollectionSizes,
} from "@repo/contracts/validation/seed/collections";
import { validateComponents } from "@repo/contracts/validation/seed/components";
import { validateSeedFieldLengths } from "@repo/contracts/validation/seed/field-lengths";
import { validateSeedIdentifiers } from "@repo/contracts/validation/seed/identifiers";
import { validateMemberships } from "@repo/contracts/validation/seed/memberships";
import {
  validateDuplicateReferences,
  validateTokenReferences,
} from "@repo/contracts/validation/seed/references";
import { validateReleases } from "@repo/contracts/validation/seed/releases";
import { validateSeedTimestamps } from "@repo/contracts/validation/seed/timestamps";
import { validateTokens } from "@repo/contracts/validation/seed/tokens";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";
import { validateUsers } from "@repo/contracts/validation/seed/users";

export type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateSeedData(seed: SeedData): SeedValidationError[] {
  return [
    ...validateSeedCollectionSizes(seed),

    ...findDuplicateIds(seed.users, "users"),
    ...findDuplicateIds(seed.projects, "projects"),
    ...findDuplicateIds(seed.tokenTypes, "tokenTypes"),
    ...findDuplicateIds(seed.components, "components"),
    ...findDuplicateIds(seed.documentTemplates, "documentTemplates"),
    ...findDuplicateIds(seed.releases, "releases"),

    ...validateDuplicateReferences(seed),
    ...validateSeedIdentifiers(seed),
    ...validateSeedFieldLengths(seed),
    ...validateUsers(seed),
    ...validateMemberships(seed),
    ...validateComponents(seed),
    ...validateReleases(seed),
    ...validateSeedTimestamps(seed),
    ...validateTokens(seed),
    ...validateTokenReferences(seed),
  ];
}
