import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://16.171.133.154:8000',
});

axiosInstance.interceptors.request.use(
    (config) => {
        // Get the token from localStorage or any storage you use
        const token = localStorage.getItem('access_token');

        // If token exists, attach it to the headers
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle the request error
        return Promise.reject(error);
    }
);

export default axiosInstance;