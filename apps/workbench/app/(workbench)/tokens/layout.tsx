import { loadTokenManifestViewModel } from "@/features/tokens/server/load-token-manifest-view-model";
import { StagedManifestProvider } from "@/features/tokens/state/staged-manifest-context";

export default async function TokensLayout({ children }: { children: React.ReactNode }) {
  const model = await loadTokenManifestViewModel();

  return <StagedManifestProvider baseManifest={model}>{children}</StagedManifestProvider>;
}
