import { getDistance } from "geolib";
import { Average } from "./average.js";
import { Client } from "./net.js";

const ais_timeout = 5 * 60; // seconds

class Data {
  constructor(params) {
    this.params = params;
    this.onC = null;
    this.onD = null;
    this.onA = null;
    this.mmsi = null;
  }

  setMMSI(mmsi) {
    this.mmsi = mmsi;
  }

  onConnection(f) {
    this.onC = f;
  }

  onData(f) {
    this.onD = f;
  }

  onAIS(f) {
    this.onA = f;
  }

  getMinMax(name) {
    return this.avg.minMax(name);
  }

  getAvg(name) {
    return this.avg.value(name);
  }

  init(boatId) {
    // Close any previous connections
    this.close();

    this.client = new Client(this.params);
    this.avg = new Average();

    const avg = this.avg;

    var d = {};
    var aisstate = {};
    var debug_data = {};

    this.client.connect(boatId);

    this.client.onconnection((data) => {
      if (this.onC !== null) {
        this.onC(data);
      }
    });

    this.client.onmessage((e) => {
      avg.push("hz", { time: new Date(), value: 1 }, 5);

      const json = JSON.parse(e.data);

      if (d.time && json.time) {
        avg.push(
          "lag",
          {
            time: new Date(json.time),
            value: new Date().getTime() - new Date(json.time).getTime(),
          },
          5
        );
      }

      if (json.aisstate) {
        aisstate = Object.assign({}, json.aisstate);
        delete json.aisstate;
        if (this.onA) {
          this.onA(aisstate);
        }
      }

      if (json.ais) {
        let user_id = Object.keys(json.ais)[0];

        aisstate = Object.assign({}, aisstate, {
          [user_id]: Object.assign({}, aisstate[user_id], json.ais[user_id], {
            time: new Date(),
          }),
        });

        // Clean old stuff
        for (let userid in aisstate) {
          if (!aisstate[userid].time) {
            delete aisstate[userid];
            continue;
          }

          if (
            new Date().getTime() - new Date(aisstate[userid].time).getTime() >=
            ais_timeout * 1000
          ) {
            console.log("removing", userid, aisstate[userid].time);
            delete aisstate[userid];
          }
        }

        delete json.ais;

        if (this.onA && user_id !== this.mmsi) {
          this.onA(aisstate);
        }
      }

      d = Object.assign({}, d, json);

      if (json.awa || json.twd || json.heading) {
        debug_data = Object.assign({}, debug_data, json);
        let dawa = debug_data.awa,
          dtwd = debug_data.twd,
          dheading = debug_data.heading;
      }

      if (json.aws) {
        avg.push("aws", { time: new Date(json.time), value: json.aws }, 5);
        avg.push("aws60", { time: new Date(json.time), value: json.aws }, 60);
        d.aws = avg.value("aws");
        d.aws60 = avg.value("aws60");
      }

      if (json.awa) {
        // To prevent averaging "flips" (going from -180 to +180 or 360 to 0), we'll add 360 to the incoming value
        // We'll flip this back later
        let awa = json.awa;
        while (awa < 360) {
          awa += 360;
        }

        avg.push("awa", { time: new Date(json.time), value: awa }, 5);
        avg.push("awa60", { time: new Date(json.time), value: awa }, 60);
      }

      if (json.twa) {
        let twa = json.twa;
        while (twa < 360) {
          twa += 360;
        }
        avg.push("twa", { time: new Date(json.time), value: twa }, 5);
        avg.push("twa60", { time: new Date(json.time), value: twa }, 60);
      }

      if (json.twd) {
        let twd = json.twd;
        avg.push("twd", { time: new Date(json.time), value: twd }, 5);
        avg.push("twd60", { time: new Date(json.time), value: twd }, 60);
      }

      if (json.tws) {
        avg.push("tws", { time: new Date(json.time), value: json.tws }, 5);
        avg.push("tws60", { time: new Date(json.time), value: json.tws }, 60);
      }

      if (json.lat && json.lng) {
        avg.push("lat", { time: new Date(json.time), value: json.lat }, 5);
        avg.push("lng", { time: new Date(json.time), value: json.lng }, 5);
        d.lastPositionTime = new Date(json.time);
      }

      if (json.depth) {
        avg.push("depth", { time: new Date(json.time), value: json.depth }, 5);
      }

      if (json.pitch) {
        avg.push("pitch", { time: new Date(json.time), value: json.pitch }, 5);
      }

      if (json.roll) {
        avg.push("roll", { time: new Date(json.time), value: json.roll }, 5);
      }

      d.tws = avg.value("tws");
      d.tws60 = avg.value("tws60");
      d.twa60 = avg.value("twa60");

      d.awa = avg.anglevalue("awa");
      d.twa = avg.anglevalue("twa");
      d.twd = avg.anglevalue("twd");

      d.awsHz = avg.hz("aws");
      d.awaHz = avg.hz("awa");
      d.allHz = avg.hz("hz");

      d.lat = avg.value("lat");
      d.lng = avg.value("lng");

      d.depth = avg.value("depth");
      d.pitch = avg.value("pitch");
      d.roll = avg.value("roll");
      d.lag = avg.value("lag");

      if (this.onD !== null) {
        this.onD(d);
      }
    });
  }

  close() {
    if (this.client) {
      this.client.close();
    }
  }
}

export { Data };
