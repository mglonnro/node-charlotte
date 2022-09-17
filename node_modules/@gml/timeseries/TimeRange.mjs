class TimeRange {
  constructor(arr) {
    if (arr) {
      this._begin = new Date(arr[0]);
      this._end = new Date(arr[1]);
    }
  }

  begin() {
    return this._begin;
  }

  end() {
    return this._end;
  }

  duration() {
    return this._end - this._begin;
  }
}

export default TimeRange;
