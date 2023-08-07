import { Data } from "../index.js";

const boatId = "0BdUhaaJEL4muiUyjpzs";

async function main() {
  const data = new Data();
  data.init(boatId);

  let sent = false;

  data.onData((d) => {
    console.log(d);
  });
}

main();
