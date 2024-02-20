import type { APIRoute } from "astro";
import { json, resolveBySha, tryCatchFlow } from "@/lib/utils";
import { isAddress } from "viem";

/**
 * This is the search route.
 *
 * 1. If the input is a tx hash or a number, it will redirect to the ethscription.
 * 2. If the input is a sha256 hash, it will check if it exists and if so resolve to that ethscription
 * 3. If the input is anything else it will try to resolve by Ethscription handle, ENS domain, or any text
 *
 * - /api/search/12 - will redirect to /api/ethscriptions/12 (ethscription #12)
 * - /api/search/<tx_hash>... - will redirect to /api/ethscriptions/<tx_hash> (ethscription with tx hash `tx_hash`)
 * - /api/search/<sha256_hash>... - will check if the sha256 hash exists and if so show the ethscription
 * - /api/search/wgw - resolve the profile of the user that currently holds the `data:,wgw` ethscription
 * - /api/search/discord:@wgw.eth - resolve the profile of the user that currently holds the `data:,discord:@wgw.eth` ethscription
 * - /api/search/1.mywallet.is - resolve the profile of user that holds the ENS domain `1.mywallet.is`
 * - /api/search/tunnckocore.eth - resolve the profile of user that holds the ENS domain `tunnckocore.eth`
 * - /api/search/2410.wgw.lol - resolve the profile of user that holds the ENS domain `2410.wgw.lol` (claimed by the user holding Ethscription #2410)
 * - /api/search/5848.water - resolve the profile of the user that holds `data:,5848.water` ethscription
 * - /api/search/123.eths - resolve the profile of the user that holds `data:,123.eths` ethscription
 * - /api/search/33.tree - resolve the profile of user that holds the 33.tree domain
 * - /api/search/00,59 - resolve the profile of user that holds the `data:,00,59` ethscription
 * - /api/search/foo bar - resolve the profile of user that holds the text `data:,foo bar` ethscription
 */
export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const input = params.input;

  const isTxHash = input.startsWith("0x") && input.length === 66;
  const isNumber = !isNaN(Number(input));
  const isAddr = isAddress(input) || /^0x[a-z0-9]{40}$/i.test(input);

  if (isTxHash || (isNumber && !isAddr)) {
    return fetch(url.toString().replace("search", "ethscriptions"));
  }

  const resp = await fetch(url.toString().replace("search", "resolve")).then(
    (x) => x.json(),
  );

  if (resp.data) {
    return json(resp, { status: 200 });
  }

  const isSha =
    !input.startsWith("0x") && /[a-z0-9]/i.test(input) && input.length === 64;

  if (isSha) {
    return resolveBySha(input, url);
  }

  return json({ error: "Not Found" }, { status: 200 });
};
