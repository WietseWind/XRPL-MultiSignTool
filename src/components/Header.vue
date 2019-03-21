<template>
  <div class="">
    <nav class="navbar navbar-expand-lg fixed-top navbar-dark bg-dark">
      <a class="navbar-brand text-white mr-auto mr-lg-0 cursor-pointer" @click="changeRoute('Home')">
        XRPL MultiSignTool
      </a>
      <button class="navbar-toggler p-0 border-0" type="button" data-toggle="offcanvas">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="navbar-collapse offcanvas-collapse" id="navbarsExampleDefault">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item" :class="{ active: route === 'TxCompose' }">
            <a class="cursor-pointer nav-link" @click="changeRoute('TxCompose')">1. Compose tx</a>
          </li>
          <li class="nav-item" :class="{ active: route === 'TxSign' }">
            <a class="cursor-pointer nav-link" @click="changeRoute('TxSign')">2. Sign tx</a>
          </li>
          <li class="nav-item" :class="{ active: route === 'TxCombine' }">
            <a class="cursor-pointer nav-link" @click="changeRoute('TxCombine')">3. Combine &amp; submit</a>
          </li>
        </ul>
        <div class="navbar-nav navbar-right">
          <button
            class="btn btn-sm ml-1"
            :disabled="live"
            :class="{ 'btn-outline-secondary': !live, 'btn-primary': live && connected, 'btn-warning': live && connecting }"
            @click="$env.connectTo(servers.live)"
          >
            <b>LIVE</b>
            <span v-if="live && connected"> @ {{ $env.rippled.ledger.ledger_index }}</span>
          </button>
          <button
            class="btn btn-sm ml-1"
            :disabled="test"
            :class="{ 'btn-outline-secondary': !test, 'btn-primary': test && connected, 'btn-warning': test && connecting }"
            @click="$env.connectTo(servers.test)"
          >
            <b>TEST</b>
            <span v-if="test && connected"> @ {{ $env.rippled.ledger.ledger_index }}</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Header',
  data () {
    return {
      servers: {
        test: 'wss://s.altnet.rippletest.net:51233',
        live: 'wss://rippled.xrptipbot.com'
      }
    }
  },
  computed: {
    live () {
      return this.$env.rippled.endpoint === this.servers.live
    },
    test () {
      return this.$env.rippled.endpoint === this.servers.test
    },
    ready () {
      return this.live || this.test
    },
    connecting () {
      return this.ready && !(this.$env.rippled.connected && this.$env.rippled.ledger)
    },
    connected () {
      return this.ready && this.$env.rippled.connected && this.$env.rippled.ledger
    }
  },
  props: {
    changeRoute: Function,
    route: String
  }
}
</script>

<style scoped lang="scss">
  a {
    &.navbar-brand {
      background-image: url('/icons/bg-000000-icon.png');
      padding-left: 60px;
      background-repeat: no-repeat;
      background-position: top left;
      background-size: 50px;
      padding-right: 40px;
    }
    &.cursor-pointer {
      cursor: pointer;
    }
  }
</style>
