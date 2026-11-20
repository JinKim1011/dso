# DSO CLI

The CLI downloads and verifies signed published releases. Currently, it supports only `dso pull`, token generation is a later command.

## Build

```bash
npm run build --workspace @repo/release-protocol
npm run build --workspace @repo/cli
```

The executable is `apps/cli/dist/cli.js`.

## Configuration

| Setting                  | Required | Description                                        |
| ------------------------ | -------- | -------------------------------------------------- |
| `DSO_API_KEY`            | yes      | Combined `dso_<keyIdentifier>_<secret>` credential |
| `DSO_API_URL`            | yes      | Workbench API base URL                             |
| `DSO_RELEASE_TRUST_FILE` | no       | Independent local trust file path                  |

The CLI never accepts the API key as a command-line option. Remote API URLs must use HTTPS. Plain HTTP is accepted only for loopback hosts outside production.

The trust file is a local JSON object:

```json
{
  "keys": {
    "release-key-2026-01": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
  }
}
```

- Each value must be an Ed25519 public key.
- Private keys, malformed PEM values, empty key IDs, and duplicate key IDs are rejected.
- The response never supplies the public key used for trust.
- During signing-key rotation, keep both the old and new key IDs in the file until all relevant cached and published releases can be reverified.

## Pull

```bash
DSO_API_KEY='dso_...' \
DSO_API_URL='https://api.example.test' \
DSO_RELEASE_TRUST_FILE="$HOME/.config/dso/trust.json" \
dso pull --release 00000000-0000-4000-8000-000000000001
```

Equivalent path overrides:

```bash
dso pull \
  --release 00000000-0000-4000-8000-000000000001 \
  --api-url https://api.example.test \
  --trust-file ./trust.json \
  --cache-dir ./.dso/cache
```

The release ID must be a UUID. The default cache path is `$XDG_CACHE_HOME/dso` or `$HOME/.cache/dso` on Linux-like systems, and `~/Library/Caches/dso` on macOS.

Each verified release is stored as:

```text
<cache-dir>/<release-id>.json
```

The CLI validates the response stream, envelope, key ID, and Ed25519 signature before writing cache. It writes a temporary file and atomically renames it over the destination. Network, schema, signature, unknown-key, and disk failures leave an existing cache file byte-for-byte unchanged.
