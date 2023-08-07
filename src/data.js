import { getDistance } from "geolib";
import { Average } from "./average.js";
import { Client } from "./net.js";
import CharlotteAPI from "./oldapi.js";

const ais_timeout = 5 * 60; // seconds

class Data {
  constructor(params) {
    this.params = params;
    this.onC = null;
    this.onD = null;
    this.onA = null;
    this.onM = null;
    this.mmsi = null;
    this.sourceMap = {};
    this.deviceMap = {};

    /* The meta struct contains data variables and their sources */
    this.meta = {};

    /* For api calls */
    this.api = new CharlotteAPI();
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

  onMeta(f) {
    this.onM = f;
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

    // Allow a second before retrieving current meta info
    setTimeout(async () => {
      try {
        this.devices = await this.api.getDevices(boatId);

        if (this.devices) {
          for (const device of this.devices) {
            this.deviceMap[device.unique_number] = device;
          }
        }

        this.claims = await this.api.getClaims(boatId);

        for (const claim of this.claims) {
          this.sourceMap[claim.src] = this.deviceMap[claim.unique_number];
        }
      } catch (e) {
        console.error("Error getting devices");
      }

      /* Update meta if we have */
      for (const key in this.meta) {
        for (const src in this.meta[key]) {
          this.meta[key][src].device = this.sourceMap[src];
        }
      }

      /* And callback ... */
      if (this.onM) {
        this.onM(Object.assign({}, this.meta));
      }
    }, 1000);

    this.client = new Client(this.params);
    this.avg = new Average();

    const avg = this.avg;

    var d = {};
    var aisstate = {};

    this.client.connect(boatId);

    this.client.onconnection((data) => {
      if (this.onC !== null) {
        this.onC(data);
      }
    });

    const DAMPING_1 = 5,
      DAMPING_2 = 60;
    const dampings = [DAMPING_1, DAMPING_2];

    const pushValue = (data, basename, params) => {
      var ret = {};

      if (data[basename]) {
        if (typeof data[basename] === "object") {
          for (const src in data[basename]) {
            /* for (const damp of dampings) {
              const key_1 = basename + ":" + src + ":" + damp.toString();
              const key_2 = src;  + ":" + damp.toString();
	   */

            /*
              avg.push(
                key_1,
                { time: new Date(data.time), value: data[basename][src] },
                damp
              ); */

            if (!ret[basename]) {
              ret[basename] = {};
            }

            ret[basename] = Object.assign(ret[basename], {
              [src]: {
                value: data[basename][src],
                /*params && params.angle
                    ? avg.anglevalue(key_1, params.precision)
                    : avg.value(key_1, params.precision), */
              },
            });
            /* } */
          }
        }
      }

      return ret;
    };

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

      /* Run through the data to see if we have some new meta info */
      let meta_updated = false;
      for (const key in json) {
        if (key === "ais" || key === "aisstate") {
          continue;
        }

        /* We're only interested in objects, ie things with actual data */
        if (typeof json[key] === "object") {
          if (!this.meta[key]) {
            this.meta[key] = {};
            meta_updated = true;
          }

          for (const src in json[key]) {
            if (!this.meta[key][src]) {
              this.meta[key][src] = {
                device: this.sourceMap[src],
                value: json[key][src],
                seen: new Date().toISOString(),
              };
              meta_updated = true;
            } else {
              this.meta[key][src].seen = new Date().toISOString();
            }
          }
        }
      }

      /* Fire callback for meta updates if we have some */
      if (meta_updated && this.onM) {
        this.onM(Object.assign({}, this.meta));
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
            delete aisstate[userid];
          }
        }

        delete json.ais;

        if (this.onA && user_id !== this.mmsi) {
          this.onA(aisstate);
        }
      }

      /* Default precision is 1 */
      const basevars = {
        aws: { precision: 1 },
        awa: { angle: true, precision: 0 },
        twa: { angle: true, precision: 0 },
        twd: { angle: true, precision: 0 },
        tws: { precision: 1 },
        lat: { precision: undefined },
        lng: { precision: undefined },
        depth: { precision: 1 },
        pitch: { precision: 1 },
        roll: { precision: 1 },
        heading: { precision: 1 },
	rot: { precision: 3 },
      };

      var tmp = {},
        ret = {};

      for (const v in basevars) {
        if (json[v]) {
          tmp = Object.assign({}, ret, pushValue(json, v, basevars[v]));

          /* Do we have any actual changes? */
          for (const k in tmp) {
            if (!d[k]) {
              ret[k] = tmp[k];
            } else {
              for (const subkey in tmp[k]) {
                if (
                  !d[k][subkey] ||
                  tmp[k][subkey].value !== d[k][subkey].value
                ) {
                  if (!ret[k]) {
                    ret[k] = Object.assign({}, d[k]);
                  }
                  ret[k][subkey] = tmp[k][subkey];
                }
              }
            }
          }
        }
      }

      d = Object.assign({}, d, ret);

      /* if (json.awa) {
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
	*/

      /*
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
	*/

      if (Object.keys(ret).length > 0 && this.onD !== null) {
        this.onD(ret);
      }
    });
  }

  send(data) {
    if (this.client) {
      this.client.send(data);
    }
  }

  close() {
    if (this.client) {
      this.client.close();
    }
  }
}

export { Data };
