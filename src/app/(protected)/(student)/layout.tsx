const Layout = async ({ children }: { children: React.ReactNode }) => {  
  // Server-side redirects disabled to prevent ngrok/mobile cookie race loops.
  // Client pages are responsible for redirecting unauthenticated users.
  return <div>{children}</div>;
};

export default Layout;
