import { CharlotteAPI } from "../index.js";

const boatId = "2zGrCQC2X9X2LbkzMhFm";
const USERAPIKEY = "...";

async function main() {
  const api = new CharlotteAPI(null, true);
  api.setUserAPIKey(USERAPIKEY);
  const res = await api.getBoats();

  console.log(res);
}

main();
