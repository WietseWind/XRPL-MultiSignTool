import Vue from 'vue'
import RippledWsClient from 'rippled-ws-client'

export default new Vue({
  data () {
    return {
      online: true,
      local: false,
      rippled: {
        endpoint: '',
        connected: false,
        ledger: null,
        connection: null,
        object: null
      },
      editorOptions: {
        // codemirror options
        tabSize: 2,
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        line: true,
        keymap: 'sublime'
      }
    }
  },
  computed: {
    devmode () {
      return window.location.hostname === 'localhost'
    }
  },
  methods: {
    async connectTo (endpoint) {
      console.log('[rippled-ws-client] Connecting to', endpoint)
      this.rippled.endpoint = endpoint
      this.rippled.connected = false
      this.rippled.connected = null

      if (this.rippled.object !== null) {
        await this.rippled.object
        await this.rippled.connection
        await this.rippled.connection.close()
        this.rippled.connection = null
        this.rippled.object = null
        this.rippled.ledger = null
      }

      this.rippled.object = new RippledWsClient(endpoint).then(c => {
        this.rippled.connected = true
        this.rippled.connection = c
        this.rippled.connection.on('state', online => {
          this.rippled.connected = online
        })
        this.rippled.connection.on('ledger', ledger => {
          this.rippled.ledger = ledger
        })
      })
    }
  },
  created () {
    window.onoffline = () => { this.online = false }
    window.ononline = () => { this.online = true }
    window['on' + (navigator.onLine ? 'online' : 'offline')]()
    this.local = !document.location.protocol.match(/^http/)
    // this.connectTo('wss://s.altnet.rippletest.net:51233')
    // this.connectTo('wss://rippled.xrptipbot.com')
  }
})
