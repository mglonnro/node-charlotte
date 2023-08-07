const DEG2RAD = (angle) => {
  return angle * (Math.PI / 180);
};

const RAD2DEG = (angle) => {
  return angle * (180 / Math.PI);
};

class Average {
  constructor() {
    this.data = {};
    this.lastValid = {};
    this.hzData = {};
    this.min = {};
    this.max = {};
  }

  push(name, value, maxtime) {
    if (!this.data[name]) {
      this.data[name] = [];
    }

    if (!this.hzData[name]) {
      this.hzData[name] = 0;
    }

    if (this.max[name] === undefined || this.max[name] < value.value) {
      this.max[name] = value.value;
    }

    if (this.min[name] === undefined || this.min[name] > value.value) {
      this.min[name] = value.value;
    }

    const now = new Date();

    this.data[name].push({ time: value.time, value: value.value });

    while (
      this.data[name].length > 0 &&
      now.getTime() - this.data[name][0].time.getTime() > maxtime * 1000
    ) {
      this.data[name].shift();
    }

    /* Calculate Hz => How often we have received changes */
    let count = 0;
    for (let y = this.data[name].length - 1; y >= 0; y--) {
      if (now.getTime() - this.data[name][y].time.getTime() <= 1000) {
        count++;
      }
    }

    this.hzData[name] = count;
  }

  minMax(name) {
    return { min: this.min[name], max: this.max[name] };
  }

  value(name, precision) {
    let ret;

    if (this.data[name] && this.data[name].length) {
      if (this.data[name].length) {
        ret = 0;
      }

      for (let x = 0; x < this.data[name].length; x++) {
        ret += this.data[name][x].value;
      }
      ret /= this.data[name].length;

      this.lastValid[name] = ret;
      return this.round(ret, precision);
    } else {
      return this.round(this.lastValid[name], precision);
    }
  }

  round(v, precision) {
    if (precision === undefined) {
      return v;
    }

    const factor = Math.pow(10, precision);
    return Math.round(v * factor) / factor;
  }

  anglevalue(name, precision) {
    let ret;

    if (this.data[name] && this.data[name].length) {
      let array = [];

      for (let x = 0; x < this.data[name].length; x++) {
        array.push(this.data[name][x].value);
      }

      let arrayLength = array.length;

      let sinTotal = 0;
      let cosTotal = 0;

      for (let i = 0; i < arrayLength; i++) {
        sinTotal += Math.sin(DEG2RAD(array[i]));
        cosTotal += Math.cos(DEG2RAD(array[i]));
      }

      let averageDirection = Math.atan(sinTotal / cosTotal) * (180 / Math.PI);

      if (cosTotal < 0) {
        averageDirection += 180;
      } else if (sinTotal < 0) {
        averageDirection += 360;
      }

      ret = averageDirection;
      this.lastValid[name] = ret;
      return this.round(ret, precision);
    } else {
      return this.round(this.lastValid[name], precision);
    }
  }

  hz(name) {
    return this.hzData[name];
  }
}

export { Average };
