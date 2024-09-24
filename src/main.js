import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles.css';
import { io } from 'socket.io-client';
import axios from 'axios';


const socket = io('http://localhost:3000'); 

const app = createApp(App);

app.config.globalProperties.$socket = socket;
app.config.globalProperties.$axios = axios;

app.use(router).mount('#app');
