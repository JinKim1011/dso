import type {
  Component,
  DocumentTemplate,
  Project,
  ProjectMember,
  Release,
  Token,
  TokenReference,
  TokenType,
  User,
} from "@repo/contracts/type";

export type SeedData = {
  users: User[];
  projects: Project[];
  projectMembers: ProjectMember[];
  tokenTypes: TokenType[];
  tokens: Token[];
  tokenReferences: TokenReference[];
  components: Component[];
  documentTemplates: DocumentTemplate[];
  releases: Release[];
};
