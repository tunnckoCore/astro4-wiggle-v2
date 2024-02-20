import type { APIRoute } from "astro";
import { publicClient } from "@/lib/viem";
import {
  cacheChecker,
  fromHexString,
  getTransaction,
  hexToUtf8,
  inputChecker,
  json,
  toHexString,
  tryCatchFlow,
  txnsCache,
} from "@/lib/utils";
// import { fromHex } from "viem";

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const q = inputChecker(params.id);
  let input = params.id;

  if (q.isTxHash) {
    const res = await getTransaction(input, url);

    return json(res, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=1, immutable" },
    });
  }

  return json({ error: "Transaction Not Found" }, { status: 200 });
};
