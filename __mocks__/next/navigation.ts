let __pathname = "/";
let __searchParams = "";

export const __setPathname = (p: string) => {
  __pathname = p;
};
export const __setSearchParams = (s: string) => {
  __searchParams = s;
};

export const usePathname = () => __pathname;
export const useSearchParams = () => new URLSearchParams(__searchParams);

export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

export const redirect = jest.fn();

