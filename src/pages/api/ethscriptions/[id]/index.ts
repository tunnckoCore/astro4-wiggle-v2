import type { APIRoute } from "astro";
import {
  cacheChecker,
  fromHexString,
  json,
  parseDataUri,
  sha256,
  tryCatchFlow,
} from "@/lib/utils";

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  let id = params.id;

  const checkIfHash = (x) => x?.startsWith("0x") && x?.length === 66;
  const idIsHash = checkIfHash(id);
  const isNumber = !isNaN(Number(id));

  if (!idIsHash && !isNumber) {
    return json({ error: "Not Found" }, { status: 200 });
  }

  if (!checkIfHash(id) && isNumber) {
    const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${id}`;
    // const resp = await tryCatchFlow(() =>
    //   fetch(upstreamUrl).then((x) => x.json()),
    // );

    const resp = await cacheChecker(upstreamUrl + "-core", () =>
      fetch(upstreamUrl).then((x) => x.json()),
    );

    if (!resp || (resp && resp.error)) {
      return json(
        { error: "An upstream failure requesting: " + upstreamUrl },
        { status: 200 },
      );
    }

    id = resp.transaction_hash;
  }

  if (checkIfHash(id)) {
    url.searchParams.set("withInput", "1");

    const withContent = url.searchParams.get("withContent");
    const withCurrentOwner = url.searchParams.get("withCurrentOwner");
    let txnsUrl = url.toString().replace("ethscriptions", "txs");
    txnsUrl = idIsHash ? txnsUrl : txnsUrl.replace("/" + params.id, "/" + id);

    console.log({ id, idIsHash, txnsUrl });

    const resp = await cacheChecker(txnsUrl + "-core", () =>
      fetch(txnsUrl).then((x) => {
        console.log({ txnsUrl, x });
        return x.json();
      }),
    );

    if (!resp) return json({ error: "Failure " + txnsUrl }, { status: 200 });
    if (!resp.data) return json(resp, { status: 200 });

    const {
      transactionInput,
      fromAddress: creatorAddress,
      toAddress: initialOwnerAddress,
      ...txn
    } = resp.data;

    const facetMime = `646174613a6170706c69636174696f6e2f766e642e66616365742e74782b6a736f6e`;
    const inputData = fromHexString(transactionInput.slice(2));
    const parseOptions = {
      ...Object.fromEntries(url.searchParams.entries()),
      defaultCharset: "utf-8",
    };

    // console.log({ transactionInput, inputData });

    const {
      input: uri,
      mimetype,
      base64: isBase64,
      ...parsed
    } = parseDataUri(inputData, parseOptions);

    const content = {
      mimetype,
      charset: parsed.charset,
      isBase64,
      // @ts-ignore quiet pls
      isEsip6: parsed.params.rule === "esip6",
      isFacet: transactionInput.includes(facetMime),
      params: parsed.params,
    };

    if (withContent) {
      // @ts-ignore next line
      content.uri = uri;
    }

    if (withCurrentOwner) {
      const fpathname = `api/ethscriptions/${txn.transactionHash}/transfers?reverse=1`;
      const res = await cacheChecker(fpathname, () =>
        fetch(`${url.origin}/${fpathname}`).then((x) => x.json()),
      );

      if (res && res.data && Array.isArray(res.data)) {
        // @ts-ignore blah
        content.currentOwner = res.data[0].toAddress;
      }
    }

    const sha = await cacheChecker(txn.transactionHash + "-sha", () =>
      sha256(uri),
    );

    return json(
      {
        data: {
          creatorAddress,
          initialOwnerAddress,
          ...txn,
          sha,
          ...content,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=666, immutable" },
      },
    );
  }

  return json({ error: "Ethscription Not Found" }, { status: 200 });
};
