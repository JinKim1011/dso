import {
  isSupportedApiKeyScope,
  isSupportedProjectMemberRole,
  isSupportedReleaseStatus,
} from "@repo/contracts/validation/enum";

isSupportedProjectMemberRole("editor") === true;
isSupportedProjectMemberRole("publisher") === true;
isSupportedProjectMemberRole("admin") === true;
isSupportedProjectMemberRole("owner") === false;

isSupportedApiKeyScope("release:read") === true;
isSupportedApiKeyScope("write") === false;

isSupportedReleaseStatus("draft") === true;
isSupportedReleaseStatus("published") === true;
isSupportedReleaseStatus("archived") === false;
