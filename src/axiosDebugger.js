const axiosDebugger = (axios, debug) => {
  const axiosLog = debug('axios');
  axios.interceptors.request.use((request) => {
    axiosLog('Request:', request.url);
    axiosLog('Request headers:', request.headers);
    return request;
  });

  axios.interceptors.response.use(
    (response) => {
      axiosLog('Response:', response.status, response.statusText);
      axiosLog('Response headers:', response.headers);
      axiosLog('Response data:', response.data);
      return response;
    },
    (error) => {
      axiosLog('Error:', error.message);
      return Promise.reject(error);
    },
  );
};

export default axiosDebugger;
