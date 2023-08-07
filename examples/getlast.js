import { CharlotteAPI } from "../index.js";

const boatId = "2zGrCQC2X9X2LbkzMhFm";

async function main() {
  const api = new CharlotteAPI(null, true);
  const res = await api.getLastKnown(
    boatId,
    new Date("2021-05-13T12:49:55.663Z"),
    "0"
  );

  console.log(res);
}

main();
