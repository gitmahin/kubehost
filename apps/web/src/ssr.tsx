
export function injectRuntimeEnv() {
  const runtimeEnv = {
    VITE_API_SERVER_URL: process.env.VITE_API_SERVER_URL || 'http://localhost:3000',
  };

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__ENV__ = ${JSON.stringify(runtimeEnv)};`,
      }}
    />
  );
}