// Extend ImportMeta interface globally
interface ImportMeta {
  readonly env: {
    readonly VITE_API_URL: string;
    readonly VITE_SOCKET_URL?: string;
  };
}