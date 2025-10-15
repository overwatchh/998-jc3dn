export const toNextJsHandler = (handler: any) => {
  return {
    GET: async () => new Response(null, { status: 501 }),
    POST: async () => new Response(null, { status: 501 }),
  };
};



