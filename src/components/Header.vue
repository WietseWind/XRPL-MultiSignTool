<template>
  <div class="">
    <nav class="navbar navbar-expand-lg fixed-top navbar-dark bg-dark">
      <a class="navbar-brand text-white mr-auto mr-lg-0 cursor-pointer" @click="changeRoute('Home')">
        <img src="icons/bg-000000-icon.png" class="logo" />
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
            :disabled="$env.live"
            :class="{ 'btn-outline-secondary': !$env.live, 'btn-primary': $env.live && connected, 'btn-warning': $env.live && connecting }"
            @click="$env.connectTo($env.servers.live)"
          >
            <b>LIVE</b>
            <span v-if="$env.live && connected"> @ {{ $env.rippled.ledger.ledger_index }}</span>
          </button>
          <button
            class="btn btn-sm ml-1"
            :disabled="$env.test"
            :class="{ 'btn-outline-secondary': !$env.test, 'btn-primary': $env.test && connected, 'btn-warning': $env.test && connecting }"
            @click="$env.connectTo($env.servers.test)"
          >
            <b>TEST</b>
            <span v-if="$env.test && connected"> @ {{ $env.rippled.ledger.ledger_index }}</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Header',
  computed: {
    ready () {
      return this.$env.live || this.$env.test
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
      padding-left: 60px;
      padding-right: 40px;
      img.logo {
        height: 50px;
        margin-left: -70px;
        position: absolute;
        margin-top: -11px;
      }
    }
    &.cursor-pointer {
      cursor: pointer;
    }
  }
</style>
