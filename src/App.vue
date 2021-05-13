<template>
  <div id="app">
    <h1>Tracker configuration</h1>
    <div v-if="error"  v-html="error" style="background-color: red; color: white"></div>
    <a href="#" @click="showConfig = !showConfig" class="clear-console">
      <div v-if="showConfig">Hide configuration</div>
      <div v-else>Show configuration</div>
    </a>
    <div v-if="showConfig">
      <div>Upload configuration file and restart tracker.</div>
      <div>File is upload immediately after select!</div>
      <br/>
      <input type="file" ref="fileupload" accept="application/json" @change="onFileChange">
      <div>
        <button v-if="selectedFile" @click="clear">Clear selection</button>
      </div>
      <br/>
      <div>
        <label for="apnhost">APN host</label>
        <input id="apnhost" v-model="apnHost" placeholder="apn host">
        <label for="apnuser">APN username</label>
        <input id="apnuser" v-model="apnUser" placeholder="apn user">
        <label for="apnpass">APN password</label>
        <input id="apnpass" v-model="apnPass" placeholder="apn pass">
      </div>
      <br/>
      <button @click="sendForm">Update config</button>
      <hr/>
    </div>

    <div v-if="moving" style="color: green"> Tracker is moving</div>
    <div v-else style="color: red"> Tracker is not moving</div>
    <div v-if="position">Position: {{ position.latitude }}, {{ position.longitude }}</div>
    <div v-if="position">Speed: {{ position.speed }} kph</div>
    <div v-if="message">Last known state: <b>{{ message.state }}</b></div>
    <h2>Log</h2>
    <div class="console">
      <div class="console-text">
        {{ log }}
      </div>
      <a href="#" @click="clearLog" class="clear-console">Clear</a>
    </div>

  </div>
</template>

<script>
export default {
  name: 'App',
  components: {},
  data() {
    return {
      showQrReader: false,
      message: "",
      host: window.location.hostname,
      // host: "192.168.88.53",
      log: "Welcome\n",
      mqttLog: "Welcome\n",
      selectedFile: false,
      position: null,
      moving: false,
      apnHost: "",
      apnUser: "",
      apnPass: "",
      showConfig: true,
      error: ""
    }
  },
  created: function () {
    this.initWs()
  },
  computed: {
    ws: {
      get: function () {
        return this.$store.getters.ws
      },
      set: function (value) {
        this.$store.commit('initWs', value)
      }
    },
    connected: {
      get: function () {
        return this.$store.getters.connected
      },
      set: function (value) {
        this.$store.commit('setConnected', value)
      }
    }
  },
  methods: {
    onFileChange(e) {
      let files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;
      this.readFile(files[0]);
    },
    readFile(file) {
      this.selectedFile = true
      let reader = new FileReader();
      reader.onload = e => {
        console.log(e.target.result);
        const json = JSON.parse(e.target.result)
        this.addMessageToLog("Configuration file \"" + file.name + "\" loaded")
        if (json.information) {
          this.addMessageToLog(json.information)
        }
        const message = {
          type: "file",
          msg: json.information,
          username: json.username,
          password: json.password,
          token: json.token,
          vehicleId: json.vehicleId,
          mqttHost: json.mqttHost,
          mqttPort: json.mqttPort,
          mqttUsername: json.mqttUsername,
          mqttPassword: json.mqttPassword,
          mqttTopic: json.mqttTopic
        }
        console.log(JSON.stringify(message))
        this.ws.send(JSON.stringify(message))
      };
      reader.readAsText(file);
    },
    sendForm() {
      this.error = ""
      if (this.apnHost.length > 20) this.error = `apn host is too long <br/>` + this.error
      if (this.apnUser.length > 20) this.error = `apn username is too long <br/>` + this.error
      if (this.apnPass.length > 20) this.error = `apn password is too long <br/>` + this.error
      const message = {
        type: "form",
        apnHost: this.apnHost,
        apnUser: this.apnUser,
        apnPass: this.apnPass,
      }
      console.log(JSON.stringify(message))
      this.ws.send(JSON.stringify(message))
    },
    addMessageToLog(msg) {
      if (msg.includes("MQTT state") || msg.includes("Modem is not")) this.mqttLog = new Date().toLocaleString() + '> ' + msg + '\n' + this.mqttLog
      this.log = new Date().toLocaleString() + '> ' + msg + '\n' + this.log
    },
    clear() {
      this.$refs.fileupload.value = null;
      this.selectedFile = false;
    },
    clearLog() {
      this.log = ""
    },
    initWs: function () {
      let hostname = this.host

      console.log("Connecting to ws://" + hostname + "/ws")
      this.ws = new WebSocket("ws://" + hostname + "/ws")

      this.ws.onopen = () => {
        this.connected = true
      };

      this.ws.onerror = (err) => {
        this.connected = false;
        console.log("WS error: " + JSON.stringify(err));
        this.restartConnection()
      };

      this.ws.onmessage = (data) => {
        this.message = JSON.parse(data.data);
        this.position = {
          latitude: this.message.latitude,
          longitude: this.message.longitude,
          speed: this.message.speed
        }
        this.moving = this.message.isMoving
        if (this.message.new) {
          this.addMessageToLog(this.message.state)
        }
      };

      this.ws.onclose = () => {
        if (this.connected) {
          console.log("Connection closed, restarting");
          this.restartConnection()
        } else {
          console.log("Connection closed")
        }
      };

      window.addEventListener('beforeunload', () => {
        console.log("Closing the page")
        if (this.ws != null && this.ws.readyState === 1) {
          this.disconnect()
        }
      }, false)
    },
    restartConnection: function () {
      setTimeout(() => {
        this.initWs()
      }, 1000)
    },
    disconnect: function () {
      console.log("Closing connection")
      this.connected = false

      if (this.ws != null)
        this.ws.close()
    },
  }
}
</script>

<style>
label {
  display: block;
  text-align: center;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.console {
  width: 400px;
  height: 255px;
  margin: 20px 0 20px;

  font-family: Arial, sans-serif;
  font-size: 12px;

  display: inline-block;
  vertical-align: top;
  position: relative;

  background: #eee;
  border: 1px dotted #333;

  transform: translate3d(0, 0, 0);
  -moz-transform: translate3d(0, 0, 0);
  -webkit-transform: translate3d(0, 0, 0);
  -o-transform: translate3d(0, 0, 0);
  -ms-transform: translate3d(0, 0, 0);
}

.console-text {
  text-align: left;
  position: absolute;
  top: 0;
  left: 0;
  width: 380px;
  height: 205px;
  padding: 25px 10px;
  overflow: auto;
  overflow-x: hidden;
  white-space: pre;
}

.clear-console {
  position: absolute;
  top: 0;
  right: 0;
  text-decoration: none;
  color: #666;
  padding: 5px 10px;
  background: #ccc;
}

.clear-console:hover {
  color: #222;
}
</style>
