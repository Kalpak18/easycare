import axios from 'axios';
import ENV from '../config/env';

const apiPublic = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
});

export default apiPublic;
