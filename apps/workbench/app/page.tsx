import { Button } from "@repo/ui/button";
import styles from "./page.module.css";

export default function Home() {
  return (

    <div className={styles.page}>
      <Button variant="fill" size="large" >fill-large</Button>
      <Button variant="fill" size="regular" >fill-regular</Button>
      <Button variant="fill" size="small" >fill-small</Button>
      <Button variant="fill" size="mini" >fill-mini</Button>
      <Button variant="outlined" size="large" >outlined-large</Button>
      <Button variant="outlined" size="regular" >outlined-regular</Button>
      <Button variant="outlined" size="small" >outlined-small</Button>
      <Button variant="outlined" size="mini" >outlined-mini</Button>
      <Button variant="void" size="large" >void-large</Button>
      <Button variant="void" size="regular" >void-regular</Button>
      <Button variant="void" size="small" >void-small</Button>
      <Button variant="void" size="mini" >void-mini</Button>

    </div>
  );
}
