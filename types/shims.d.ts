declare module '@vitejs/plugin-react-swc' {
  const plugin: any;
  export default plugin;
}

declare module 'lovable-tagger' {
  export const componentTagger: any;
}

// Fallback shims for editor/typecheck in minimal environments
declare module 'react' {
  const React: any;
  export = React;
  export default React;
}

declare module 'react/jsx-runtime' {
  const jsxRuntime: any;
  export = jsxRuntime;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
  export function useQuery<T = any>(opts: any): { data: T; isLoading: boolean; isError: boolean };
}
