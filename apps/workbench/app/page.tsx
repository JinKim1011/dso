import { Button } from "@repo/ui/button";

export default function Home() {
  return (
    <div className="gap-small flex flex-col">
      <div className="gap-mini flex items-center">
        <Button variant="fill" size="lg">
          fill/lg
        </Button>
        <Button variant="fill" size="md">
          fill/md
        </Button>
        <Button variant="fill" size="sm">
          fill/sm
        </Button>
      </div>
      <div className="gap-mini flex items-center">
        <Button variant="outlined" size="lg">
          outlined/lg
        </Button>
        <Button variant="outlined" size="md">
          outlined/md
        </Button>
        <Button variant="outlined" size="sm">
          outlined/sm
        </Button>
      </div>
      <div className="gap-mini flex items-center">
        <Button variant="void" size="lg">
          void/lg
        </Button>
        <Button variant="void" size="md">
          void/md
        </Button>
        <Button variant="void" size="sm">
          void/sm
        </Button>
      </div>
      <div className="gap-mini flex items-center">
        <Button variant="void" size="lg" inline>
          void/inline/lg
        </Button>
        <Button variant="void" size="md" inline>
          void/inline/md
        </Button>
        <Button variant="void" size="sm" inline>
          void/inlie/sm
        </Button>
      </div>
    </div>
  );
}
