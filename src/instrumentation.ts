export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Only run on Node.js runtime (server-side)
    const { initializeServer } = await import("@/lib/server/init");
    initializeServer();
  }
}
