import client from './client';

const BASE = '/admin/coupons';

export const getAll    = (params) => client.get(BASE, { params });
export const create    = (data) => client.post(BASE, data);
export const update    = (id, data) => client.put(`${BASE}/${id}`, data);
export const remove    = (id) => client.delete(`${BASE}/${id}`);
