import designTokensManifest from "../../../../design-tokens-manifest.json";
import { buildTokenGraphModel } from "./lib/manifestAdapter";
import { TokensView } from "./TokensView";

const result = buildTokenGraphModel(designTokensManifest);

export default function TokensPage() {
  return <TokensView model={result.model} />;
}
