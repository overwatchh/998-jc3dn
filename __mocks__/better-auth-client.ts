type ClientConfig = { baseURL?: string; fetchOptions?: any };

let __lastConfig: ClientConfig | undefined;
export const __getLastCreateConfig = () => __lastConfig;

export const createAuthClient = (config: ClientConfig = {}) => {
  __lastConfig = config;
  return {
    signIn: jest.fn(),
    signOut: jest.fn(),
  } as any;
};

