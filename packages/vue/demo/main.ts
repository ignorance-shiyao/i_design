import Vue from 'vue'
import App from './App.vue'
import '@i-design/common/styles/index.css'

Vue.config.productionTip = false
new Vue({ render: (h) => h(App) }).$mount('#app')
