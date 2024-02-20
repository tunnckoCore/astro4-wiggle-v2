import { converterMapper, json, tryCatchFlow } from "@/lib/utils";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const sha = url.searchParams.get("sha");

  if (!sha) {
    return json({ result: false, error: "No sha provided" }, { status: 200 });
  }

  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/exists/${sha}`;
  const resp = await tryCatchFlow(() =>
    fetch(upstreamUrl).then((x) => x.json()),
  );

  console.log("/exists with sha and current owner", resp);

  if (!resp || (resp && resp.error)) {
    return json(
      { result: false, error: `An upstream failure request: ${upstreamUrl}` },
      { status: 200 },
    );
  }

  if (resp.result) {
    return json(
      {
        result: true,
        data: {
          ...converterMapper(resp.ethscription, url),
          currentOwner: resp.ethscription.current_owner.toLowerCase(),
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=1, immutable" },
      },
    );
  }

  return json({ result: false, error: "Not Found" }, { status: 200 });
};
