import { CharlotteAPI } from "../index.js";

const boatId = "2zGrCQC2X9X2LbkzMhFm";
const USERAPIKEY = "...";

async function main() {
  const api = new CharlotteAPI(null, true);
  api.setUserAPIKey(USERAPIKEY);
  const res = await api.getTrips(boatId);

  console.log(res);

  let total = 0, totaltime = 0;

  for (let x = 0; x < res.length; x++) {
    let date = new Date(res[x].start);

    if (date.getTime() < new Date(2021, 5, 13)) {
      total += res[x].realdistance;
      totaltime += res[x].duration;
      console.log(res[x].start, res[x].realdistance, total, res[x].duration, totaltime);
    }
  }
}

main();
