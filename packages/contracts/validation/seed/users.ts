import type { SeedData } from "@repo/contracts/seed";
import { validateEmail } from "@repo/contracts/validation/email";
import type { SeedValidationError } from "@repo/contracts/validation/seed/types";

export function validateUsers(seed: SeedData): SeedValidationError[] {
  const errors: SeedValidationError[] = [];

  for (const user of seed.users) {
    const issue = validateEmail(user.email);

    if (issue) {
      errors.push({
        code: "invalid-field",
        collection: "users",
        id: user.id,
        field: "email",
        message: issue.message,
      });
    }
  }

  return errors;
}
