export class CliUsageError extends Error {
  readonly exitCode = 2;

  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

export class CliConfigurationError extends Error {
  readonly exitCode = 1;

  constructor() {
    super("The CLI configuration is invalid.");
    this.name = "CliConfigurationError";
  }
}
