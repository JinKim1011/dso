import { RowSpacingIcon } from "@radix-ui/react-icons";
import { TokenTypeValueItem } from "../../tokens/_shared/lib/manifestAdapter";
import { StagedRowDetailTag } from "./StagedRowDetailTag";
import { StagedRowDetailValue } from "./StagedRowDetailValue";

type StagedRowDetailProps = {
  id: string;
  beforeName: string;
  afterName: string;
  before: TokenTypeValueItem;
  after: TokenTypeValueItem;
};

export function StagedRowDetail({
  id,
  beforeName,
  afterName,
  before,
  after,
}: StagedRowDetailProps) {
  const wrapperStyle = [
    "w-full flex flex-col h-full",
    "py-largePlus px-large gap-regular",
    "bg-dot-pattern overflow-hidden",
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
          </div>
        </div>
      </div>
    </aside>
  );
}
