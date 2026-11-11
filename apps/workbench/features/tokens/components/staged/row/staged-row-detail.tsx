import { StagedRowDetailReferences } from "@/features/tokens/components/staged/row/staged-row-detail-references";
import { StagedRowDetailTag } from "@/features/tokens/components/staged/row/staged-row-detail-tag";
import { StagedRowDetailValue } from "@/features/tokens/components/staged/row/staged-row-detail-value";
import type { ReferenceChange } from "@/features/tokens/model/staged/staged-change";
import type {
  TokenGraphViewModel,
  TokenValueViewModel,
} from "@/features/tokens/model/token-graph";
import { RowSpacingIcon } from "@radix-ui/react-icons";

type StagedRowDetailProps = {
  id: string;
  beforeName: string;
  afterName: string;
  before: TokenValueViewModel;
  after: TokenValueViewModel;
  references: ReferenceChange[];
  baseModel: TokenGraphViewModel;
  draftModel: TokenGraphViewModel;
};

export function StagedRowDetail({
  id,
  beforeName,
  afterName,
  before,
  after,
  references,
  baseModel,
  draftModel,
}: StagedRowDetailProps) {
  const wrapperStyle = [
    "w-full flex flex-col h-full",
    "py-largePlus px-large gap-regular rounded-mini border",
    "bg-dot-pattern overflow-hidden border-stroke-secondary",
  ].join(" ");

  return (
    <aside className={wrapperStyle} data-testid={`detail: ${id}`}>
      <div className="gap-regular flex w-full flex-col">
        <div className="flex flex-col" data-testid={`after-detail: ${id}`}>
          <StagedRowDetailTag
            label="AFTER"
            background="bg-surface-primary"
            textColor="text-content-accentStrong"
          />
          <div className="py-miniPlus bg-surface-primary gap-micro flex h-fit w-full flex-col">
            <StagedRowDetailValue
              type="afterName"
              beforeName={beforeName}
              afterName={afterName}
            />
            <StagedRowDetailValue type="afterValue" after={after} before={before} />
            <StagedRowDetailReferences
              side="after"
              references={references}
              model={draftModel}
            />
          </div>
        </div>
        <StagedRowDetailTag
          align="justify-center"
          label="Changes"
          textColor="text-content-accentStrong"
          leftIcon={RowSpacingIcon}
        />
        <div className="flex flex-col" data-testid={`before-detail: ${id}`}>
          <StagedRowDetailTag
            label="BEFORE"
            background="bg-surface-primary"
            textColor="text-content-accentStrong"
          />
          <div className="py-miniPlus bg-surface-primary gap-micro flex h-fit w-full flex-col">
            <StagedRowDetailValue
              type="beforeName"
              beforeName={beforeName}
              afterName={afterName}
            />
            <StagedRowDetailValue type="beforeValue" before={before} after={after} />
            <StagedRowDetailReferences
              side="before"
              references={references}
              model={baseModel}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
