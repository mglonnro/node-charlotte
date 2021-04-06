# Charlotte - your digital crew member

[<img width="400" alt="Mapbox" src="https://storage.googleapis.com/charlotte-public/og_image_default.png">](https://beta.charlotte.lc/)

Charlotte is a system for gathering, storing and analyzing NMEA data (this is data from marine sensors) in the cloud. 

`node-charlotte` is a `Node.js` library wrapped around the Charlotte REST API  

## Installation

```
npm i node-charlotte
```

## Hello, boat!

Using Promises:

```
test.mjs:

import CharlotteAPI from "node-charlotte";

const boatId = "2zGrCQC2X9X2LbkzMhFm"; // public boat
const apiKey = null; // not needed for public data
const api = new CharlotteAPI(apiKey);

api.getBoat(boatId)
  .then(boat => {
    console.log(boat.name); // "s/y Charlotte"
  });
```

Using async/await

```
test.mjs

import CharlotteAPI from "node-charlotte";

const boatId = "2zGrCQC2X9X2LbkzMhFm"; // public boat
const apiKey = null; // not needed for public data
const api = new CharlotteAPI(apiKey);

async function main() {
  let boat = await api.getBoat(boatId);
  console.log(boat.name); // "s/y Charlotte"
}

main();
```

## Functions

### `getBoats()`
List all boats.

### `getBoat(boatId)`
Get a specific boat.

### `getDevices(boatId)`
List the NMEA devices for a specific boat. 

### `async getLastKnown(boatId, time, resolution)`
Get the last known data for a specific `boatId`, before a specific point in `time` and using data `resolution`: 

- "0" = raw data, no averaging
- "01" = 6 seconds average data (0.1 minute)
- "1" = 1 minute average data
- "10" = 10 minutes average data

### `async getMarks(lat, lng)`
Get the seamarks (Finnish area 3D marks) around a specific point.

### `async getSpeeds(boatId, params)`
Get boat performance for a specific boat calculated based on the recorded data. 

`params` is a JSON object specifying the query parameters, that are listed in the [API documentation here](https://humeko.stoplight.io/docs/charlotteapi/CharlotteAPI.v1.json/paths/~1boats~1%7BboatId%7D~1speeds/get).

Example:

```
import CharlotteAPI from "../index.mjs";

const boatId = "2zGrCQC2X9X2LbkzMhFm";

async function main() {
  var api = new CharlotteAPI();
  var res = await api.getSpeeds(boatId, { variationlimits: true, unit: "kt" });

  console.log(res);
}

main();
``` 

### `getTrips(boatId)`
List all detected trips for a specific boat.

### `getTrip(boatId, tripId)`
Get a specific trip.

### `uploadData(boatId, fileName)`
Upload file `filename` to the cloud storage for the specified `boatId`.

