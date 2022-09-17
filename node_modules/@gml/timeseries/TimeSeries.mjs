class TimeSeries {
  constructor({ resolution, data }) {
    this.resolution = resolution;
    this.data = Object.assign([], data);
  }

  crop(range) {
    let b = range.begin(),
      e = range.end();
    let newData = [];

    for (var x = 0, l = this.data.length; x < l; x++) {
      if (this.data[x].time >= b && this.data[x].time <= e) {
        newData.push(Object.assign({}, this.data[x]));
      }
    }

    return new TimeSeries({ resolution: this.resolution, data: newData });
  }

  max(column) {
    let ret = undefined;

    for (var x = 0, l = this.data.length; x < l; x++) {
      if (ret === undefined || this.data[x][column] > ret) {
        ret = this.data[x][column];
      }
    }

    return ret;
  }

  merge(src) {
    if (src && src.data.length) {
      if (!this.data || this.data.length == 0) {
        this.data = Object.assign({}, src);
      } else {
        if (src.data[0].time < this.data[0].time) {
          for (var x = src.data.length - 1; x >= 0; x--) {
            this.data.unshift(Object.assign({}, src.data[x]));
          }
        } else {
          for (var x = 0, l = src.data.length; x < l; x++) {
            this.data.push(Object.assign({}, src.data[x]));
          }
        }
      }
    }
  }

  isEmpty() {
    return !this.data || this.data.length == 0;
  }
}

export default TimeSeries;
