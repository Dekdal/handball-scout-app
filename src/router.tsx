import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Strip the trailing slash from Vite's BASE_URL ("/net-ninja-notes/" -> "/net-ninja-notes")
// so the router mounts correctly under the GitHub Pages subpath. Falls back to "/".
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    basepath,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
