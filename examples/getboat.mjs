import CharlotteAPI from "../index.mjs";

const boatId = "2zGrCQC2X9X2LbkzMhFm";

async function main() {
  const api = new CharlotteAPI();
  const res = await api.getBoat(boatId);

  console.log(res);
}

main();
