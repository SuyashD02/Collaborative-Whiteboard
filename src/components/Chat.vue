<template>
    <div class="chat-container">
      <div class="messages">
        <div 
          v-for="message in messages" 
          :key="message.id" 
          :class="{'own-message': message.username === username, 'other-message': message.username !== username}"
        >
          <strong>{{ message.username }}:</strong> {{ message.text }}
        </div>
      </div>
      <input v-model="messageText" @keyup.enter="sendMessage" placeholder="Send a message..." />
    </div>
  </template>
  
  <script>
  export default {
    props: ['username', 'roomId'],
    data() {
      return {
        messages: [],
        messageText: '',
      };
    },
    mounted() {
      this.$socket.on('chat-message', (message) => {
        this.messages.push(message);
      });
    },
    methods: {
      sendMessage() {
        if (this.messageText.trim() === '') return;
        const message = {
          username: this.username,
          text: this.messageText,
          roomId: this.roomId,
        };
        this.$socket.emit('chat-message', message); 
        this.messageText = ''; 
      },
    },
  };
  </script>
  
  <style scoped>
  .chat-container {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 300px;
    max-height: 400px;
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  .messages {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 10px;
  }
  
  .own-message {
    text-align: right;
    background-color: #daf1da;
    margin-left: auto;
    padding: 5px 10px;
    border-radius: 12px;
    max-width: 80%;
  }
  
  .other-message {
    text-align: left;
    background-color: #f1f1f1;
    margin-right: auto;
    padding: 5px 10px;
    border-radius: 12px;
    max-width: 80%;
  }
  
  input {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.9);
    outline: none;
  }
  </style>
  