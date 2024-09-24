import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const getUsers = () => {
  return axios.get(`${API_BASE_URL}/users`);
};

export const addUser = (username) => {
  return axios.post(`${API_BASE_URL}/users`, { username });
};

export const getDrawings = (roomId) => {
  return axios.get(`${API_BASE_URL}/drawings/${roomId}`);
};

export const saveDrawing = (roomId, drawingData) => {
  return axios.post(`${API_BASE_URL}/drawings`, { roomId, drawingData });
};
