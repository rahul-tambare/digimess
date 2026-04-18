import client from './client';

const BASE = '/admin/charges';

export const getAll    = () => client.get(BASE);
export const create    = (data) => client.post(BASE, data);
export const update    = (id, data) => client.put(`${BASE}/${id}`, data);
export const remove    = (id) => client.delete(`${BASE}/${id}`);
