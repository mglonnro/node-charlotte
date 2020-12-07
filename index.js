import fetch from "node-fetch";
import geolib from "geolib";
import { TimeData, TimeSeries } from "@gml/timeseries";

const API_BETA = "https://community.nakedsailor.blog/api.beta/";
const API = API_BETA;

class CharlotteAPI {
  constructor(idToken) {
    this.host = "https://community.nakedsailor.blog/api.beta/";

    if (idToken) {
      this.auth = idToken;
    }
  }

  setAuth(idToken) {
    this.auth = idToken;
  }

  async afetch(url, opt) {
    var headers = {};

    if (this.auth) {
      headers.authorization = "Bearing " + this.auth;
    }

    var opts = Object.assign({ method: "GET" }, opt, {
      headers: Object.assign({}, opt ? opt.headers : {}, headers)
    });
    console.log("opts", JSON.stringify(opts));

    const res = await fetch(url, opts);

    return res;
  }

  async setProfilePic(boatId, pic) {
    try {
      const res = await fetch(this.host + "boats/" + boatId + "/photo", {
        method: "PUT",
        body: pic,
        headers: {
          "Content-Type": "text/plain",
          authorization: "Bearing " + this.auth
        }
      });
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getPositionForTime(boatId, t) {
    try {
      const res = await fetch(
        this.host + "boat/" + boatId + "/lastposition/" + t.toISOString()
      );
      var o = await res.json();
      console.log(JSON.stringify(o));
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getLastKnown(longId, t) {
    try {
      const res = await fetch(this.host + "boats/" + longId + "/history/last/");
      var o = await res.json();
      console.log(JSON.stringify(o));
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getMarks(lat, lng) {
    try {
      const res = await fetch(this.host + "marks?lat=" + lat + "&lng=" + lng);
      var o = await res.json();
      //console.log(JSON.stringify(o));
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getLiveState(longId) {
    try {
      const res = await fetch(this.host + "boats/" + longId + "/livestate");
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

  async getDevices(longId) {
    try {
      let url = this.host + "boats/" + longId + "/devices";

      const res = await fetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getClaims(longId) {
    try {
      let url = this.host + "boats/" + longId + "/claims";

      const res = await fetch(url);
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

      const res = await fetch(url);
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

      const res = await fetch(url);
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

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
      const res = await fetch(url);

      var o = await res.json();
      return new TimeData(o);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getShortId(boatId) {
    try {
      const res = await fetch(this.host + "boats/" + boatId + "/shortid");
      var o = res.text();
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

  async getBoats() {
    try {
      const res = await this.afetch(this.host + "boats");
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
        headers: { "Content-Type": "application/json" }
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
        method: "DELETE"
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
        headers: { "Content-Type": "application/json" }
      });
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async getBoatsHistory(boatId, avgmin, fromTime, toTime) {
    try {
      const res = await fetch(
        this.host +
          "boats/" +
          boatId +
          "/history/?start=" +
          fromTime.toISOString() +
          "&end=" +
          toTime.toISOString() +
          "&resolution=" +
          avgmin
      );
      var o = res.json();
      return o;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export default CharlotteAPI;
