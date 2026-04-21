import { api } from './api';

export const fetchCategories = async () => {
  const res = await api.get('/categories');
  return res.data;
};
