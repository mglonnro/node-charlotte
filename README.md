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
  ````

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

### `getTrips(boatId)`
List all detected trips for a specific boat.

### `getTrip(boatId, tripId)`
Get a specific trip.

### `uploadData(boatId, fileName)`
Upload file `filename` to the cloud storage for the specified `boatId`.

```
