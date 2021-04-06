import CharlotteAPI from "../index.mjs";

const boatId = "2zGrCQC2X9X2LbkzMhFm";

async function main() {
  var api = new CharlotteAPI();
  var res = await api.getSpeeds(boatId, { variationlimits: true, unit: "kt" });

  for (let x = 0; x < res.data.length; x++) {
    let output = res.data[x].twa + ";";
    for (let y = 0; y < res.data[x].sog.length; y++) {
      if (res.data[x].sog[y] === null) {
        output += ";";
      } else {
        output += res.data[x].sog[y] + ";";
      }
    }
    console.log(output);
  }
}

main();
