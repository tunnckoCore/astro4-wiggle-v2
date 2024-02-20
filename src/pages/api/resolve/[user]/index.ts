import type { APIRoute } from "astro";
import {
  createResponse,
  json,
  parseDataUri,
  resolveRedirectPath,
  sha256,
  tryCatchFlow,
} from "@/lib/utils";
import { normalize } from "viem/ens";
import { publicClient } from "@/lib/viem";
import { isAddress } from "viem";

// TODO: replace with own indexer/db/filters

export const GET: APIRoute = async ({ params, request, redirect }) => {
  const url = new URL(request.url);
  const input = params.user;

  const redirectPath = await resolveRedirectPath(input, url, true);

  if (redirectPath.startsWith("/tx")) {
    url.pathname = redirectPath.replace("/tx", "/api/ethscriptions");
    return fetch(url);
  }

  if (redirectPath.startsWith("/address")) {
    const [_, user] = redirectPath.split("address/");
    return json(
      { data: await createResponse(user, input, url) },
      {
        status: 200,
        // headers: { "Cache-Control": "public, max-age=31536000, immutable" },
        headers: { "Cache-Control": "public, max-age=120, immutable" },
      },
    );
  }

  const [_, err] = redirectPath.split("?error=");

  return json({ error: err }, { status: 200 });
};

// export const GET: APIRoute = async ({ params, request, redirect }) => {
//   const url = new URL(request.url);
//   const user = params.user;
//   const isTxHash = user.startsWith("0x") && user.length === 66;

//   if (isTxHash) {
//     return fetch(url.toString().replace("resolve", "ethscriptions"));
//   }

//   if (isAddress(user) || /^0x[a-z0-9]{40}$/i.test(user)) {
//     // console.log("wut", user);
//     return json(
//       { data: await createResponse(user, user, url) },
//       {
//         status: 200,
//         // headers: { "Cache-Control": "public, max-age=31536000, immutable" },
//         headers: { "Cache-Control": "public, max-age=120, immutable" },
//       },
//     );
//   }

//   const address = await tryCatchFlow(() =>
//     publicClient.getEnsAddress({
//       name: normalize(user),
//     }),
//   );

//   if (address) {
//     return json(
//       { data: await createResponse(address, user, url) },
//       { status: 200 },
//     );
//   }

//   const sha = await sha256(`data:,${user}`);

//   console.log({ koko: sha, sha });

//   let upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/exists/${sha}`;

//   let resp = await tryCatchFlow(() => fetch(upstreamUrl).then((x) => x.json()));

//   if (!resp || (resp && resp.error)) {
//     return json(
//       { error: "An upstream failure requesting: " + upstreamUrl },
//       { status: 200 },
//     );
//   }

//   if (!resp.result) {
//     return json({ error: "Cannot resolve anything" }, { status: 200 });
//   }

//   const mode = url.searchParams.get("mode") || "current_owner";
//   const addr = resp.ethscription[mode];

//   return json({ data: await createResponse(addr, user, url) }, { status: 200 });
// };
