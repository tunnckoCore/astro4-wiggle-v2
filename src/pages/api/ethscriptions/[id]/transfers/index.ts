import type { APIRoute } from "astro";
import { cacheChecker, json, tryCatchFlow } from "@/lib/utils";

// TODO: replace with own transfers api (the indexer db will basically be just tracking of ownership state)

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const id = params.id;
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${id}`;

  const result = await cacheChecker(upstreamUrl, () =>
    fetch(upstreamUrl).then((x) => x.json()),
  );

  if (!result || (result && result.error)) {
    return json(
      { error: "An upstream failure requesting: " + upstreamUrl },
      { status: 200 },
    );
  }

  const transfers = result.valid_transfers.map((x) => {
    const {
      transaction_hash: transactionHash,
      transaction_index: transactionIndex,
      block_number: blockNumber,
      timestamp,
      from: fromAddress,
      to: toAddress,
    } = x;

    return {
      transactionHash,
      transactionIndex,
      blockNumber,
      timestamp,
      fromAddress,
      toAddress,
    };
  });

  const isReverse = url.searchParams.get("reverse");

  return json(
    {
      total_count: transfers.length,
      data: isReverse ? transfers.reverse() : transfers,
    },
    { status: 200 },
  );
};
