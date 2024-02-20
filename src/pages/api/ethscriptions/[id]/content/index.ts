import type { APIRoute } from "astro";
import { tryCatchFlow } from "@/lib/utils";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/content", "");
  url.searchParams.set("withContent", "1");

  const result = await fetch(url).then((x) => x.json());

  if (!result.data) {
    return new Response(null, { status: 400 });
  }

  const resp = await tryCatchFlow(() => fetch(result.data.uri));

  if (!resp) {
    return new Response(null, { status: 400 });
  }

  return new Response(resp.body, {
    headers: {
      ...resp.headers,
      "Cache-Control": "public, max-age=5555, immutable",
    },
  });
};
