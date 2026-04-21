import api from './api';
import { ServiceCategory } from '../types';

export const getCategories = async (): Promise<ServiceCategory[]> => {
  const res = await api.get('/categories');
  return res.data;
};
