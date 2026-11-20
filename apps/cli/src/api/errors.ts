export class ReleaseApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Release API request failed with status ${status}.`);
    this.name = "ReleaseApiError";
    this.status = status;
  }
}

export class ReleaseApiNetworkError extends Error {
  constructor() {
    super("Release API request could not be completed.");
    this.name = "ReleaseApiNetworkError";
  }
}

export class ReleaseApiTimeoutError extends Error {
  constructor() {
    super("Release API request timed out.");
    this.name = "ReleaseApiTimeoutError";
  }
}

export class ReleaseApiResponseError extends Error {
  constructor() {
    super("Release API returned an invalid response.");
    this.name = "ReleaseApiResponseError";
  }
}
