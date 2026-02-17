import { Button } from "@repo/ui/button";

export default function Home() {
  return (
    <div className="gap-small flex flex-col">
      <div className="gap-min flex">
        <Button variant="fill" size="large">
          fill-large
        </Button>
        <Button variant="fill" size="regular">
          fill-regular
        </Button>
        <Button variant="fill" size="small">
          fill-small
        </Button>
        <Button variant="fill" size="mini">
          fill-mini
        </Button>
      </div>
      <div className="gap-mini flex">
        <Button variant="outlined" size="large">
          outlined-large
        </Button>
        <Button variant="outlined" size="regular">
          outlined-regular
        </Button>
        <Button variant="outlined" size="small">
          outlined-small
        </Button>
        <Button variant="outlined" size="mini">
          outlined-mini
        </Button>
      </div>
      <div className="gap-mini flex">
        <Button variant="void" size="large">
          void-large
        </Button>
        <Button variant="void" size="regular">
          void-regular
        </Button>
        <Button variant="void" size="small">
          void-small
        </Button>
        <Button variant="void" size="mini">
          void-mini
        </Button>
      </div>
      <div className="gap-mini flex">
        <Button variant="void" size="large" inline>
          void-large-inline
        </Button>
        <Button variant="void" size="regular" inline>
          void-regular-inline
        </Button>
        <Button variant="void" size="small" inline>
          void-small-inline
        </Button>
        <Button variant="void" size="mini" inline>
          void-mini-inline
        </Button>
      </div>
    </div>
  );
}
