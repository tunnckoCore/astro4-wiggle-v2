import type { APIRoute } from "astro";
import { json, tryCatchFlow } from "@/lib/utils";

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${id}`;

  const result = await tryCatchFlow(() =>
    fetch(upstreamUrl).then((x) => x.json()),
  );

  if (!result || (result && result.error)) {
    return json(
      { error: "An upstream failure requesting: " + upstreamUrl },
      { status: 200 },
    );
  }

  return json({ data: result.ethscription_number }, { status: 200 });
};
