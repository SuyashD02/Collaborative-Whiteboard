<template>
    <div class="main-container">
    <div class="login-container">
      <h2>Join a Whiteboard Session</h2>
      <input type="text" v-model="username" placeholder="Enter your name" />
      <input type="text" v-model="roomId" placeholder="Enter Room ID" />
      <button @click="joinRoom">Join</button>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
</div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        username: '',
        roomId: '',
        error: '',
      };
    },
    methods: {
      joinRoom() {
        if (this.username.trim() === '' || this.roomId.trim() === '') {
          this.error = '* Both fields are required.';
          return;
        }
        this.error = '';
        this.$emit('login', { username: this.username, roomId: this.roomId });
      },
    },
  };
  </script>
  
  <style scoped>
  .main-container{
    display: flex;
    justify-content: center;
  }
  .login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 95%;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

input {
  margin: 10px 0;
  padding: 12px;
  width: 90%;
  border-radius: 8px;
  outline: none;
  border: 1px solid #ccc;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #007bff;
}

button {
  padding: 12px 40px;
  background-color: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s, transform 0.3s;
}

button:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.error {
  color: red;
  margin-top: 10px;
  font-weight: bold;
}
  </style>
  