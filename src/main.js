import Vue from 'vue'
import App from './App.vue'
import SweetAlert from 'sweetalert'
import RippledEnv from './env'
import VueClipboard from 'vue-clipboard2'

VueClipboard.config.autoSetContainer = true
Vue.use(VueClipboard)

Vue.prototype.$swal = SweetAlert
Vue.prototype.$env = RippledEnv

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
