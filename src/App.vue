<template>
  <div id="app">
    <Header :route="route" :changeRoute="changeRoute" />

    <main role="main" class="container">
      <keep-alive>
        <component :is="route" :route="route" :changeRoute="changeRoute" :routeData="routeData" />
      </keep-alive>

      <div class="text-right">
        <small class="text-muted">
          Mode: {{ $env.online ? 'online' : 'offline' }} - {{ $env.local ? 'local' : 'web' }},
          By: <a href="https://twitter.com/WietseWind" target="_blank">@WietseWind</a>,
          Source: <a href="https://github.com/WietseWind/XRPL-MultiSignTool" target="_blank">Github.com</a>
        </small>
      </div>
    </main>
  </div>
</template>

<script>
import Header from './components/Header'
import Home from './components/Home'
import MultiSignSetup from './components/MultiSignSetup'
import TxCompose from './components/TxCompose'
import TxSign from './components/TxSign'
import TxCombine from './components/TxCombine'

export default {
  name: 'app',
  components: {
    Header,
    Home,
    TxCompose,
    TxSign,
    TxCombine,
    MultiSignSetup
  },
  methods: {
    changeRoute (route, routeData) {
      this.routeData = {}
      if (typeof routeData === 'object' && routeData !== null) {
        this.routeData = routeData
      }
      console.log('[ChangeRoute]', route)
      this.route = route
    }
  },
  data () {
    return {
      route: 'Home',
      routeData: {}
    }
  }
}
</script>

<style lang="scss">
  // Source & inspiration: https://getbootstrap.com/docs/4.1/examples/offcanvas/

  html,
  body {
    overflow-x: hidden; /* Prevent scroll on narrow devices */
  }

  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding-top: 56px;
    padding-bottom: 15px;
  }

  @media (max-width: 991.98px) {
    .offcanvas-collapse {
      position: fixed;
      top: 56px; /* Height of navbar */
      bottom: 0;
      left: 100%;
      width: 100%;
      padding-right: 1rem;
      padding-left: 1rem;
      overflow-y: auto;
      visibility: hidden;
      background-color: #343a40;
      transition-timing-function: ease-in-out;
      transition-duration: .3s;
      transition-property: left, visibility;
    }
    .offcanvas-collapse.open {
      left: 0;
      visibility: visible;
    }
  }

  .nav-scroller {
    position: relative;
    z-index: 2;
    height: 2.75rem;
    overflow-y: hidden;
  }

  .nav-scroller .nav {
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: nowrap;
    flex-wrap: nowrap;
    padding-bottom: 1rem;
    margin-top: -1px;
    overflow-x: auto;
    color: rgba(255, 255, 255, .75);
    text-align: center;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }

  .nav-underline .nav-link {
    padding-top: .75rem;
    padding-bottom: .75rem;
    font-size: .875rem;
    color: #6c757d;
  }

  .nav-underline .nav-link:hover {
    color: #007bff;
  }

  .nav-underline .active {
    font-weight: 500;
    color: #343a40;
  }

  .text-white-50 { color: rgba(255, 255, 255, .5); }

  .bg-purple { background-color: #6f42c1; }

  .lh-100 { line-height: 1; }
  .lh-125 { line-height: 1.25; }
  .lh-150 { line-height: 1.5; }

  // Code editor
  div.cm-s-monokai.CodeMirror { border-radius: 4px; height: 250px; }

  // Prettified JSON
  .vjs__tree .vjs__value__string { color: #35B64C; font-weight: bold; }
  .error .vjs__tree .vjs__value__string { color: #ca0000; font-weight: bold; }
  .vjs__value__string { word-break: break-all; }
</style>
