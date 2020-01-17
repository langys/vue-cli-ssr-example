import Vue from 'vue'
import VueCompositionApi from '@vue/composition-api'
import App from './App'
import { createRouter } from './router'
import { createStore } from './store'

Vue.config.productionTip = false
Vue.use(VueCompositionApi)

export function createApp () {
  const router = createRouter()
  const store = createStore()
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })
  return { app, router }
}
