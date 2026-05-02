import designTokensManifest from "../../../../design-tokens-manifest.json";
import { StagedManifestProvider } from "../_shared/context/StagedManifestContext";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(designTokensManifest);

export default function TokensPage() {
  return (
    <StagedManifestProvider baseManifest={result.model}>
      <TokensView model={result.model} />;
    </StagedManifestProvider>
  );
}
