import type { APIRoute } from "astro";
import { json, tryCatchFlow, converterMapper } from "@/lib/utils";

// TODO: replace with own indexer/db/filters

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/owned", "");

  const resp = await fetch(url).then((x) => x.json());

  if (!resp.data) {
    return json(resp, { status: 200 });
  }

  const userAddress = resp.data?.address;
  const upstreamUrl = new URL(
    `https://api.ethscriptions.com/api/ethscriptions/filtered`,
  );

  for (const [key, value] of url.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }

  upstreamUrl.searchParams.set("current_owner", userAddress);

  const res = await tryCatchFlow(() =>
    fetch(upstreamUrl).then((x) => x.json()),
  );

  if (!res || (res && res.error)) {
    return json(
      { error: "Failed to fetch data from upstream: " + upstreamUrl },
      { status: 200 },
    );
  }

  const { ethscriptions, ...rest } = res;

  return json(
    { ...rest, data: ethscriptions.map((x) => converterMapper(x, url)) },
    { status: 200 },
  );
};
