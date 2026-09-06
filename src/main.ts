import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import IDesign from './components'
import './styles/global.css'

createApp(App).use(router).use(IDesign).mount('#app')
