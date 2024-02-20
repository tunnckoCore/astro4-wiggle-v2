import type { APIRoute } from "astro";
import { json } from "@/lib/utils";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/creator", "/transfers");

  const resp = await fetch(url).then((x) => x.json());

  if (!resp.data) return json(resp, { status: 200 });

  return json(
    { data: resp.data[0].fromAddress },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=5555, immutable" },
    },
  );
};
