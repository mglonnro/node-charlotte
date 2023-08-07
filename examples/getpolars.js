import { CharlotteAPI } from "../index.js";

// const boatId = "2zGrCQC2X9X2LbkzMhFm";
const boatId = "0BdUhaaJEL4muiUyjpzs";

async function main() {
  var api = new CharlotteAPI(null, true);
  var res = await api.getSpeeds(boatId, {
    variationlimits: true,
    unit: "kt",
    after: "2022-06-29",
    before: "2022-07-01",
  });

  console.log(res);

  for (let x = 0; x < res.data.length; x++) {
    let output = res.data[x].twa + ";";
    for (let y = 0; y < res.data[x].stw.length; y++) {
      if (res.data[x].stw[y] === null) {
        output += ";";
      } else {
        output += res.data[x].stw[y] + ";";
      }
    }
    console.log(output);
  }
}

main();
