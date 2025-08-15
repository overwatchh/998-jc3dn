// common response for all apis
export type BaseApiResponse = {
  message: string;
};

// Generic type for API response when a array of data is returned
export type ApiArrayResponse<T> = BaseApiResponse & {
  count: number;
  data: T;
};
