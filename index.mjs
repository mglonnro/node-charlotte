import fetch from "node-fetch";
import geolib from "geolib";
import Hasher from "./hasher.mjs";
import { TimeData, TimeSeries } from "@gml/timeseries";
import fs from "fs";

const API_BETA = "https://community.nakedsailor.blog/api.beta/";
const API = API_BETA;

class CharlotteAPI {
  constructor(idToken) {
    this.host = "https://community.nakedsailor.blog/api.beta/";

    if (idToken) {
      this.auth = idToken;
    }
  }

  static getServer() {
    return API;
  }

  setAuth(idToken) {
    this.auth = idToken;
  }

  setAPIKey(apiKey) {
    this.apiKey = apiKey;
  }

  async afetch(url, opt) {
    var headers = {};

    if (this.auth) {
      headers.authorization = "Bearing " + this.auth;
    }

    var opts = Object.assign({ method: "GET" }, opt, {
      headers: Object.assign({}, opt ? opt.headers : {}, headers),
    });

    let realurl = url;
    if (this.apiKey) {
      if (url.includes("?") == false) {
        realurl += "?api_key=" + this.apiKey;
      } else {
        realurl += "&api_key=" + this.apiKey;
      }
    }
    const res = await fetch(realurl, opts);
    return res;
  }

  async setProfilePic(boatId, pic) {
    try {
      const res = await fetch(this.host + "boats/" + boatId + "/photo", {
        method: "PUT",
        body: pic,
        headers: {
          "Content-Type": "text/plain",
          authorization: "Bearing " + this.auth,
        },
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* Deprecated */
  async getPositionForTime(boatId, t) {
    try {
      const res = await this.afetch(
        this.host + "boat/" + boatId + "/lastposition/" + t.toISOString()
      );
      var o = await res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getLastKnown(longId, t, resolution) {
    try {
      var params = [];
      if (t) {
        params.push("before=" + t.toISOString());
      }

      if (resolution) {
        params.push("resolution=" + resolution);
      }

      let query = "";
      for (let x = 0; x < params.length; x++) {
        if (x > 0) {
          query += "&";
        }
        query += params[x];
      }

      let url = this.host + "boats/" + longId + "/history/last/?" + query;
      console.log("URL", url);

      const res = await this.afetch(url);
      var o = await res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getMarks(lat, lng) {
    try {
      const res = await this.afetch(
        this.host + "marks?lat=" + lat + "&lng=" + lng
      );
      var o = await res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getLiveState(longId) {
    try {
      const res = await this.afetch(
        this.host + "boats/" + longId + "/livestate"
      );
      var o = await res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getHistoryTS(boatId, avgmin, fromTime, toTime) {
    var data = await this.getHistory(boatId, avgmin, fromTime, toTime);

    var series = [];
    var ret = new TimeData();

    for (var k in data) {
      if (k == "start" || k == "end") {
        continue;
      }

      ret.addData(k, data[k]);
    }

    return ret;
  }

  getArea(sw, ne) {
    let a = geolib.getDistance(
      { latitude: sw.lat, longitude: sw.lng },
      { latitude: sw.lat, longitude: ne.lng }
    );

    let b = geolib.getDistance(
      { latitude: sw.lat, longitude: sw.lng },
      { latitude: ne.lat, longitude: sw.lng }
    );

    // Result is in meters, we'll return square kilometers
    return (a / 1000) * (b / 1000);
  }

  async getMediaGeoJSON(longId, after, before) {
    try {
      let url = this.host + "boats/" + longId + "/media?geojson=1";

      if (after) {
        url += "&after=" + after.toISOString();
      }

      if (before) {
        url += "&before=" + before.toISOString();
      }

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getMedia(longId, after, before) {
    try {
      let url = this.host + "boats/" + longId + "/media?";

      if (after) {
	url += "after=" + after.toISOString();
      }

      if (before) {
	if (after) {
	  url += "&";
	}

	url += "before=" + before.toISOString();
      }

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }


  async getDevices(longId) {
    try {
      let url = this.host + "boats/" + longId + "/devices";

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getSources(longId) {
    try {
      let url = this.host + "boats/" + longId + "/sources";

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async updateSources(boatId, data) {
    try {
      const res = await this.afetch(
        this.host + "boats/" + boatId + "/sources",
        {
          method: "PUT",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );
      return res;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async uploadData(boatId, fileName) {
    const stats = fs.statSync(fileName);
    const fileSizeInBytes = stats.size;
    const readStream = fs.createReadStream(fileName);

    const hasher = new Hasher();
    let hash = await hasher.getHash(fileName);

    console.log("fileName", fileName);
    console.log("fileSizeInBytes", fileSizeInBytes);
    console.log("hash", hash);

    try {
      const res = await this.afetch(
        this.host +
          "boats/" +
          boatId +
          "/data?" +
          "filename=" +
          encodeURIComponent(fileName) +
          "&hash=" +
          hash,
        {
          method: "PUT",
          body: readStream,
          headers: {
            "Content-length": fileSizeInBytes,
          },
        }
      );
      console.dir(res);
    } catch (e) {
      console.error(e);
    }
  }

  async getClaims(longId) {
    try {
      let url = this.host + "boats/" + longId + "/claims";

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getTrips(longId) {
    try {
      let url = this.host + "boats/" + longId + "/trips";

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getTrip(longId, tripId) {
    try {
      let url = this.host + "boats/" + longId + "/trips/" + tripId;

      const res = await this.afetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  /* fixme Needs refactoring
  async getHistoryByLocation(boatId, src, resolution, sw, ne) {
    try {
      let url =
        this.host +
        "boats/" +
        boatId +
        "/positionhistory?sw=" +
        JSON.stringify(sw) +
        "&ne=" +
        JSON.stringify(ne) +
        "&resolution=" +
        resolution;
      const res = await this.afetch(url);

      var o = await res.json();
      return new TimeData(o);
    } catch (err) {
      console.error(err);
      return null;
    }
  } */

  async getShortId(boatId) {
    try {
      const res = await this.afetch(this.host + "boats/" + boatId + "/shortid");
      var o = res.text();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getApiKey(boatId) {
    try {
      const res = await this.afetch(this.host + "boats/" + boatId + "/apikey");
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getNewApiKey(boatId) {
    try {
      const res = await this.afetch(
        this.host + "boats/" + boatId + "/newapikey"
      );
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getBoat(boatId) {
    try {
      const res = await this.afetch(this.host + "boats/" + boatId);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getBoats(params) {
    try {
      const res = await this.afetch(
        this.host + "boats" + this.makeQueryString(params)
      );
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async updateBoat(boatId, data) {
    try {
      const res = await this.afetch(this.host + "boats/" + boatId, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async deleteBoat(boatId) {
    try {
      const res = await this.afetch(this.host + "boats/" + boatId, {
        method: "DELETE",
      });

      if (res.status == 200) {
        return { isActive: false };
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async addBoat(data) {
    try {
      const res = await this.afetch(this.host + "boats", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getHistory(boatId, resolution, fromTime, toTime, sources) {
    try {
      const res = await this.afetch(
        this.host +
          "boats/" +
          boatId +
          "/history/?start=" +
          fromTime.toISOString() +
          "&end=" +
          toTime.toISOString() +
          "&resolution=" +
          resolution +
          (sources ? "&sources=" + JSON.stringify(sources) : "")
      );
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async processUpload(boatId, id) {
    const res = await this.afetch(
      this.host + "boats/" + boatId + "/process/" + id
    );
    if (res.status == 200) {
      return true;
    } else {
      return false;
    }
  }

  async getFileStatus(boatId, id) {
    const res = await this.afetch(
      this.host + "boats/" + boatId + "/files/" + id + "/status"
    );
    var o = res.json();
    return o;
  }

  makeQueryString(data) {
    var ret = "";

    if (data) {
      let keys = Object.keys(data);
      if (keys.length > 0) {
        ret = "?";

        for (let x = 0; x < keys.length; x++) {
          ret += keys[x] + "=" + encodeURIComponent(data[keys[x]]);
          if (x < keys.length) {
            ret += "&";
          }
        }
      }
    }

    return ret;
  }
}

export default CharlotteAPI;
