import TimeRange from "./TimeRange.mjs";

class TimeData {
  constructor(d) {
    if (d) {
      this.data = Object.assign({}, d.data);

      // Convert date strings to dates
      for (let k in this.data) {
        if (this.data[k].data.length) {
          for (let x = 0; x < this.data[k].data.length; x++) {
            this.data[k].data[x].time = new Date(this.data[k].data[x].time);
          }
        }
      }

      this.metadata = Object.assign({}, d.metadata);
    } else {
      this.data = {};
      this.metadata = {};
    }
  }

  updateBeginEnd(series) {
    if (
      series &&
      series.data &&
      series.data[0] &&
      series.data[series.data.length - 1]
    ) {
      console.log(
        "updateBeginEnd",
        series.data[0].time,
        series.data[series.data.length - 1].time
      );
    } else {
      console.log("updateBeginEnd null", JSON.stringify(series));
    }
    if (series && series.data && series.data.length > 0) {
      if (!this.beginDate || series.data[0].time < this.beginDate) {
        this.beginDate = new Date(series.data[0].time);
      }

      if (
        !this.endDate ||
        series.data[series.data.length - 1].time > this.endDate
      ) {
        this.endDate = new Date(series.data[series.data.length - 1].time);
      }
    }
  }

  begin() {
    return this.beginDate;
  }

  end() {
    return this.endDate;
  }

  timerange() {
    return new TimeRange([this.beginDate, this.endDate]);
  }

  isEmpty() {
    for (var k in this.data) {
      if (this.data[k].data.length > 0) return false;
    }

    return true;
  }

  size() {
    return undefined;
  }

  addData(name, series) {
    this.data[name] = series;
    this.updateBeginEnd(series);
  }

  setMeta(name, value) {
    this.metadata[name] = value;
    return this;
  }

  meta(name) {
    return this.metadata[name];
  }

  crop(range) {
    return this.slice(range.begin(), range.end());
  }

  atTime(t) {
    let lengths = {};
    let ret = {};
    let maxLength = 0;
    for (let k in this.data) {
      var l = this.data[k].data.length;
      lengths[k] = l;
      if (l > maxLength) {
        maxLength = l;
      }
    }

    for (var x = 0; x < maxLength; x++) {
      var done = true;

      for (let k in this.data) {
        if (x < lengths[k] && this.data[k].data[x].time < t) {
          done = false;
          ret[k] = this.data[k].data[x];
        }
      }

      if (done) {
        break;
      }
    }

    // flatten it
    let ret2 = {};

    for (let k in this.data) {
      ret2 = Object.assign(ret2, ret[k]);
    }
    return ret2;
  }

  max(k, column) {
    var maxValue = undefined;
    if (this.data[k]) {
      for (var x = 0, l = this.data[k].data.length; x < l; x++) {
        if (maxValue === undefined || this.data[k].data[x][column] > maxValue) {
          maxValue = this.data[k].data[x][column];
        }
      }
    }

    return maxValue;
  }

  mergeData(src) {
    for (var k in src.data) {
      if (!this.data[k]) {
        this.data[k] = Object.assign({}, src.data[k]);
      } else {
        console.log(
          "Before merge 1",
          k,
          JSON.stringify(this.data[k].data[0]),
          JSON.stringify(this.data[k].data[this.data[k].data.length - 1])
        );
        console.log(
          "Before merge 2",
          k,
          JSON.stringify(src.data[k].data[0]),
          JSON.stringify(src.data[k].data[src.data[k].data.length - 1])
        );
        this.data[k].merge(src.data[k]);
        console.log(
          "Afgter merge",
          k,
          JSON.stringify(this.data[k].data[0]),
          JSON.stringify(this.data[k].data[this.data[k].data.length - 1])
        );
      }

      this.updateBeginEnd(this.data[k]);
    }
  }

  slice(start, end) {
    var ret = { data: {}, metadata: Object.assign({}, this.metadata) };
    var beginDate = null,
      endDate = null;

    for (var k in this.data) {
      console.log("Cropping", k, start, end);
      ret.data[k] = this.data[k].crop(new TimeRange([start, end]));

      if (ret.data[k].data.length) {
        if (!beginDate || ret.data[k].data[0].time < beginDate) {
          beginDate = this.data[k].data[0].time;
        }

        if (
          !endDate ||
          this.data[k].data[this.data[k].data.length - 1].time > endDate
        ) {
          endDate = this.data[k].data[this.data[k].data.length - 1].time;
        }
      }
    }

    let r = new TimeData(ret);
    r.setMeta("start", beginDate).setMeta("end", endDate);
    return r;
  }
}

export default TimeData;
