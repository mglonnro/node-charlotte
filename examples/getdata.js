import { CharlotteAPI } from "../index.js";

const boatId = "2zGrCQC2X9X2LbkzMhFm";

async function main() {
  const api = new CharlotteAPI(null, true);

  const res = await api.getData(boatId, "0", new Date("2021-08-01T05:00:00.000Z"), 
	new Date("2021-08-01T05:05:00.000Z"),
	"wind",
	undefined);

  console.log(JSON.stringify(res));
}

main();
