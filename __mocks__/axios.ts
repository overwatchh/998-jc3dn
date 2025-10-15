type AxiosConfig = { baseURL?: string; withCredentials?: boolean; headers?: Record<string, string> };

let __lastCreateConfig: AxiosConfig | undefined;

export const __getLastCreateConfig = () => __lastCreateConfig;

export const create = jest.fn((config: AxiosConfig = {}) => {
  __lastCreateConfig = config;
  return {
    defaults: {
      baseURL: config.baseURL,
      withCredentials: config.withCredentials,
      headers: config.headers || {},
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  } as any;
});

const axiosDefault = { create } as any;
export default axiosDefault;
