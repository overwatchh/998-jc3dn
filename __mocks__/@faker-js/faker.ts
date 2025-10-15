export const faker = {
  number: {
    int: ({ min = 0, max = 1 }: { min?: number; max?: number } = {}) =>
      Math.min(max, Math.max(min, 0)),
  },
};



