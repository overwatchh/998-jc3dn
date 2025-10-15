import React from "react";

export class QueryClient {
  constructor(_: any) {}
}

export const QueryClientProvider: React.FC<{ client: any; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const useQuery = jest.fn().mockImplementation(() => ({
  data: undefined,
  isPending: false,
  isLoading: false,
  error: undefined,
}));

export const useMutation = jest.fn().mockImplementation((opt: any) => ({
  mutate: jest.fn(),
  mutateAsync: async (...args: any[]) => {
    const res = await opt.mutationFn(...args);
    if (typeof opt.onSuccess === "function") {
      opt.onSuccess(res);
    }
    return res;
  },
  isPending: false,
  isLoading: false,
}));
