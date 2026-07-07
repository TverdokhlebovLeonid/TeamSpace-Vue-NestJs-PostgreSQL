import '@/assets/main.css'
import {i18n} from '@/i18n'
import {useAuthStore} from '@/stores/auth'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from '@/App.vue'
import router from '@/router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(i18n)
const authStore = useAuthStore(pinia)
await authStore.initialize()
app.use(router)
app.mount('#app')
