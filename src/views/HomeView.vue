<template>
  <div>
    <LoginComponent v-if="!loggedIn" @login="onLogin" />
    <WhiteboardComponent v-if="loggedIn" :username="username" :roomId="roomId" :users="users" />
    <Chat v-if="loggedIn" :username="username" :roomId="roomId" />
  </div>
</template>

<script>
import LoginComponent from '../components/LoginComponent.vue';
import WhiteboardComponent from '../components/Whiteboard.vue';
import Chat from '../components/Chat.vue';
import { addUser } from '@/services/api';

export default {
  data() {
    return {
      loggedIn: false,
      username: '',
      roomId: '',
      users: [],
    };
  },
  components: {
    LoginComponent,
    WhiteboardComponent,
    Chat,
  },
  methods: {
    async onLogin({ username, roomId }) {
      console.log('Username:', username);
      this.username = username;
      this.roomId = roomId;
      this.loggedIn = true;

      const socket = this.$socket;

      try {
        await addUser(username);
      } catch (error) {
        console.error('Error adding user:', error);
      }

      socket.emit('join', { username, roomId });

      socket.on('user-list', (users) => {
        this.users = users;
      });

      socket.on('chat-message', (message) => {
        console.log('Received chat message:', message);
      });
    },
  },
};
</script>
