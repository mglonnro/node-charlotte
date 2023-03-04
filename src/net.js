import "websocket-polyfill";

const CLOUD_ADDRESS =
  "wss://community.nakedsailor.blog/api/boat/$BOATID/dataclient2";
const LOCAL_ADDRESS = "ws://charlotte.local:7681/";
const LOCAL_ADDRESS_ANDROID = "ws://charlotte:7681/";

class Client {
  constructor(params) {
    this.ws = {
      local: {
        address:
          params && params.platform === "android"
            ? LOCAL_ADDRESS_ANDROID
            : LOCAL_ADDRESS,
        ws: null,
        active: false,
        interval: null,
      },
      cloud: {
        address: CLOUD_ADDRESS,
        ws: null,
        active: false,
        interval: null,
      },
    };
    this.listeners = [];
    this.conn_listeners = [];
    this.connect_called = false;
  }

  // This is the root function that starts keeping alive connections until someone asks us not to
  connect(boatId) {
    if (!boatId) {
      throw "Cannot connect without boatId";
    }

    this.ws.cloud.address = this.ws.cloud.address.replace("$BOATID", boatId);

    if (this.connect_called) {
      throw "Connect should only be called once!";
    }

    this.connect_called = true;

    this.init("local");
    this.init("cloud");

    this.pingInterval = setInterval(() => {
      if (this.ws.cloud.ws && this.ws.readyState === 1) {
        try {
          this.ws.cloud.ws.send(JSON.stringify({ cmd: "ping" }));
        } catch (e) {
          console.error(e);
        }
      }
    }, 2000);
  }

  send(data) {
    if (this.ws.local.ws && this.ws.local.active) {
      this.ws.local.ws.send(JSON.stringify(data));
    } else if (this.ws.cloud.ws && this.ws.cloud.active) {
      this.ws.cloud.ws.send(JSON.stringify(data));
    }
  }

  onmessage(f) {
    this.listeners.push(f);
  }

  onconnection(f) {
    this.conn_listeners.push(f);
  }

  notifyConnListeners() {
    const data = {
      cloud: Object.assign({}, this.ws.cloud, {
        isReady: this.ws.cloud.ws ? this.ws.cloud.ws.readyState === 1 : false,
      }),
      local: Object.assign({}, this.ws.local, {
        isReady: this.ws.local.ws ? this.ws.local.ws.readyState === 1 : false,
      }),
    };

    for (let x = 0; x < this.conn_listeners.length; x++) {
      this.conn_listeners[x](data);
    }
  }

  init(name) {
    console.log("Attempting", name, "connection to", this.ws[name].address);
    try {
      this.ws[name].ws = new WebSocket(this.ws[name].address);
    } catch (e) {
      console.error(e);
    }

    this.ws[name].ws.onopen = () => {
      console.log(name, "connected");
      this.notifyConnListeners();
    };
    this.ws[name].ws.onclose = (e) => {
      console.log(name, "disconnected, retrying ...");
      this.ws[name].active = false;

      if (name === "local") {
        if (this.ws.cloud.ws && this.ws.cloud.ws.readyState === 1) {
          try {
            this.ws.cloud.ws.send(JSON.stringify({ cmd: "unpause" }));
            this.ws.cloud.active = true;
          } catch (e) {
            console.error(e);
          }
        }
      }

      this.notifyConnListeners();

      this.ws[name].ws.interval = setTimeout(() => {
        this.init(name);
      }, 2000);
    };
    this.ws[name].ws.onerror = (e) => {
      console.error(e.message);
    };
    this.ws[name].ws.onmessage = (e) => {
      //console.log("message", name, "local.active", this.ws.local.active, "cloud.active", this.ws.cloud.active, e.data);
      // If we're receiving local messages, put the cloud connection on hold
      if (name === "local" && !this.ws.local.active) {
        this.ws.local.active = true;
        if (this.ws.cloud.ws && this.ws.cloud.active) {
          console.log("Pausing cloud ...");
          if (this.ws.cloud.ws.readyState === 1) {
            try {
              this.ws.cloud.ws.send(JSON.stringify({ cmd: "pause" }));
            } catch (e) {
              console.error(e);
            }
          }
          this.ws.cloud.active = false;
        }

        this.notifyConnListeners();
      }

      if (name === "cloud") {
        if (this.ws.local.active === true) {
          if (this.ws.cloud.ws) {
            console.log("Pausing cloud (from cloud message) ...");
            if (this.ws.cloud.ws.readyState === 1) {
              try {
                this.ws.cloud.ws.send(JSON.stringify({ cmd: "pause" }));
              } catch (e) {
                console.error(e);
              }
            }
            this.ws.cloud.active = false;
          }
          return;
        }

        if (this.ws.cloud.active === false) {
          this.ws.cloud.active = true;
          this.notifyConnListeners();
        }
      }

      for (let x = 0; x < this.listeners.length; x++) {
        this.listeners[x](e);
      }
    };
  }

  close() {
    if (this.ws.cloud.ws) {
      this.ws.cloud.ws.onmessage = null;
      this.ws.cloud.ws.onclose = null;
      this.ws.cloud.ws.close();
      this.ws.cloud.ws = null;
    }
    if (this.ws.local.ws) {
      this.ws.local.ws.onmessage = null;
      this.ws.local.ws.onclose = null;
      this.ws.local.ws.close();
      this.ws.local.ws = null;
    }

    if (this.ws.cloud.interval) {
      clearInterval(this.ws.cloud.interval);
      this.ws.cloud.interval = null;
    }

    if (this.ws.local.interval) {
      clearInterval(this.ws.local.interval);
      this.ws.local.interval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export { Client };
