import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true, // Important for sending/receiving cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
