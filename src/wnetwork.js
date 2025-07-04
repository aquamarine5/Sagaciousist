/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */
import axios from 'axios';
import { ElNotification } from 'element-plus';

const service = axios.create({
    baseURL: import.meta.env.VITE_APIHOST,
    timeout: 5000
});

service.interceptors.response.use(
    response => {
        if (response.data.status === 'err') {
            ElNotification({
                title: '错误',
                message: response.data.message || '发生未知错误',
                type: 'error',
            });
            return Promise.reject(new Error(response.data.message || '发生未知错误'));
        }
        return response;
    },
    error => {
        console.log(error);
        let message = error.response ? error.response.data ? error.response.data.message : undefined : undefined;
        ElNotification({
            title: error.message,
            message: message,
            type: 'error',
        });
        return Promise.reject(error);
    }
);

export default class wnetwork {
    static get(url, params) {
        return service.get(url, { params });
    }

    static post(url, data) {
        return service.post(url, data);
    }
}