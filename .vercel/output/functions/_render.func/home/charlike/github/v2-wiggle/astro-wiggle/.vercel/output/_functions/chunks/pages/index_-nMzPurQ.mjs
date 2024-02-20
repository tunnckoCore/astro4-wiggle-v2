import { t as tryCatchFlow, j as json, c as cacheChecker, f as fromHexString, p as parseDataUri, s as sha256, a as converterMapper, r as resolveRedirectPath, b as createResponse, d as resolveBySha } from './_id__k_zasVnK.mjs';
import { isAddress } from 'viem';

const GET$b = async ({ request }) => {
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
      "Cache-Control": "public, max-age=5555, immutable"
    }
  });
};

const index$b = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$b
}, Symbol.toStringTag, { value: 'Module' }));

const GET$a = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/creator", "/transfers");
  const resp = await fetch(url).then((x) => x.json());
  if (!resp.data)
    return json(resp, { status: 200 });
  return json(
    { data: resp.data[0].fromAddress },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=5555, immutable" }
    }
  );
};

const index$a = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$a
}, Symbol.toStringTag, { value: 'Module' }));

const GET$9 = async ({ params }) => {
  const id = params.id;
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${id}`;
  const result = await tryCatchFlow(
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!result || result && result.error) {
    return json(
      { error: "An upstream failure requesting: " + upstreamUrl },
      { status: 200 }
    );
  }
  return json({ data: result.ethscription_number }, { status: 200 });
};

const index$9 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$9
}, Symbol.toStringTag, { value: 'Module' }));

const GET$8 = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/owner", "/transfers");
  url.searchParams.set("reverse", "1");
  const resp = await fetch(url).then((x) => x.json());
  if (!resp.data)
    return json(resp, { status: 200 });
  return json({ data: resp.data[0].toAddress }, { status: 200 });
};

const index$8 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$8
}, Symbol.toStringTag, { value: 'Module' }));

const GET$7 = async ({ params, request }) => {
  const url = new URL(request.url);
  const id = params.id;
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${id}`;
  const result = await cacheChecker(
    "upstreamUrl",
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!result || result && result.error) {
    return json(
      { error: "An upstream failure requesting: " + upstreamUrl },
      { status: 200 }
    );
  }
  const transfers = result.valid_transfers.map((x) => {
    const {
      transaction_hash: transactionHash,
      transaction_index: transactionIndex,
      block_number: blockNumber,
      timestamp,
      from: fromAddress,
      to: toAddress
    } = x;
    return {
      transactionHash,
      transactionIndex,
      blockNumber,
      timestamp,
      fromAddress,
      toAddress
    };
  });
  const isReverse = url.searchParams.get("reverse");
  return json(
    {
      total_count: transfers.length,
      data: isReverse ? transfers.reverse() : transfers
    },
    { status: 200 }
  );
};

const index$7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$7
}, Symbol.toStringTag, { value: 'Module' }));

const GET$6 = async ({ params, request }) => {
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
    const resp = await cacheChecker(
      upstreamUrl + "-core",
      () => fetch(upstreamUrl).then((x) => x.json())
    );
    if (!resp || resp && resp.error) {
      return json(
        { error: "An upstream failure requesting: " + upstreamUrl },
        { status: 200 }
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
    const resp = await cacheChecker(
      txnsUrl + "-core",
      () => fetch(txnsUrl).then((x) => x.json())
    );
    if (!resp.data)
      return json(resp, { status: 200 });
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
      defaultCharset: "utf-8"
    };
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
      params: parsed.params
    };
    if (withContent) {
      content.uri = uri;
    }
    if (withCurrentOwner) {
      const fpathname = `api/ethscriptions/${txn.transactionHash}/transfers?reverse=1`;
      const res = await cacheChecker(
        fpathname,
        () => fetch(`${url.origin}/${fpathname}`).then((x) => x.json())
      );
      content.currentOwner = res?.data[0]?.toAddress;
    }
    const sha = await cacheChecker(
      txn.transactionHash + "-sha",
      () => sha256(uri)
    );
    return json(
      {
        data: {
          creatorAddress,
          initialOwnerAddress,
          ...txn,
          sha,
          ...content
        }
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=666, immutable" }
      }
    );
  }
  return json({ error: "Ethscription Not Found" }, { status: 200 });
};

const index$6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$6
}, Symbol.toStringTag, { value: 'Module' }));

const GET$5 = async ({ request }) => {
  const url = new URL(request.url);
  const upstreamUrl = new URL(
    `https://api.ethscriptions.com/api/ethscriptions/filtered`
  );
  for (const [key, value] of url.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }
  const res = await tryCatchFlow(
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!res || res && res.error) {
    return json(
      { error: "Failed to fetch data from upstream: " + upstreamUrl },
      { status: 200 }
    );
  }
  const { ethscriptions, ...rest } = res;
  return json(
    { ...rest, data: ethscriptions.map((x) => converterMapper(x, url)) },
    { status: 200 }
  );
};

const index$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$5
}, Symbol.toStringTag, { value: 'Module' }));

const GET$4 = async ({ request }) => {
  const url = new URL(request.url);
  const sha = url.searchParams.get("sha");
  if (!sha) {
    return json({ result: false, error: "No sha provided" }, { status: 200 });
  }
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/exists/${sha}`;
  const resp = await tryCatchFlow(
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!resp || resp && resp.error) {
    return json(
      { result: false, error: `An upstream failure request: ${upstreamUrl}` },
      { status: 200 }
    );
  }
  if (resp.result) {
    return json(
      {
        result: true,
        data: {
          ...converterMapper(resp.ethscription, url),
          currentOwner: resp.ethscription.current_owner
        }
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=5000, immutable" }
      }
    );
  }
  return json({ result: false, error: "Not Found" }, { status: 200 });
};

const index$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$4
}, Symbol.toStringTag, { value: 'Module' }));

const GET$3 = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/created", "");
  const resp = await fetch(url).then((x) => x.json());
  if (!resp.data) {
    return json(resp, { status: 200 });
  }
  const userAddress = resp.data?.address;
  const upstreamUrl = new URL(
    `https://api.ethscriptions.com/api/ethscriptions/filtered`
  );
  for (const [key, value] of url.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }
  upstreamUrl.searchParams.set("creator", userAddress);
  const res = await tryCatchFlow(
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!res || res && res.error) {
    return json(
      { error: "Failed to fetch data from upstream: " + upstreamUrl },
      { status: 200 }
    );
  }
  const { ethscriptions, ...rest } = res;
  return json(
    { ...rest, data: ethscriptions.map((x) => converterMapper(x, url)) },
    { status: 200 }
  );
};

const index$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$3
}, Symbol.toStringTag, { value: 'Module' }));

const GET$2 = async ({ request }) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/owned", "");
  const resp = await fetch(url).then((x) => x.json());
  if (!resp.data) {
    return json(resp, { status: 200 });
  }
  const userAddress = resp.data?.address;
  const upstreamUrl = new URL(
    `https://api.ethscriptions.com/api/ethscriptions/filtered`
  );
  for (const [key, value] of url.searchParams.entries()) {
    upstreamUrl.searchParams.set(key, value);
  }
  upstreamUrl.searchParams.set("current_owner", userAddress);
  const res = await tryCatchFlow(
    () => fetch(upstreamUrl).then((x) => x.json())
  );
  if (!res || res && res.error) {
    return json(
      { error: "Failed to fetch data from upstream: " + upstreamUrl },
      { status: 200 }
    );
  }
  const { ethscriptions, ...rest } = res;
  return json(
    { ...rest, data: ethscriptions.map((x) => converterMapper(x, url)) },
    { status: 200 }
  );
};

const index$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$2
}, Symbol.toStringTag, { value: 'Module' }));

const GET$1 = async ({ params, request, redirect }) => {
  const url = new URL(request.url);
  const input = params.user;
  const redirectPath = await resolveRedirectPath(input, url, true);
  if (redirectPath.startsWith("/tx")) {
    url.pathname = redirectPath.replace("/tx", "/api/ethscriptions");
    return fetch(url);
  }
  if (redirectPath.startsWith("/address")) {
    const [_2, user] = redirectPath.split("address/");
    return json(
      { data: await createResponse(user, input, url) },
      {
        status: 200,
        // headers: { "Cache-Control": "public, max-age=31536000, immutable" },
        headers: { "Cache-Control": "public, max-age=120, immutable" }
      }
    );
  }
  const [_, err] = redirectPath.split("?error=");
  return json({ error: err }, { status: 200 });
};

const index$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET: GET$1
}, Symbol.toStringTag, { value: 'Module' }));

const GET = async ({ params, request }) => {
  const url = new URL(request.url);
  const input = params.input;
  const isTxHash = input.startsWith("0x") && input.length === 66;
  const isNumber = !isNaN(Number(input));
  const isAddr = isAddress(input) || /^0x[a-z0-9]{40}$/i.test(input);
  if (isTxHash || isNumber && !isAddr) {
    return fetch(url.toString().replace("search", "ethscriptions"));
  }
  const resp = await fetch(url.toString().replace("search", "resolve")).then(
    (x) => x.json()
  );
  if (resp.data) {
    return json(resp, { status: 200 });
  }
  const isSha = !input.startsWith("0x") && /[a-z0-9]/i.test(input) && input.length === 64;
  if (isSha) {
    return resolveBySha(input, url);
  }
  return json({ error: "Not Found" }, { status: 200 });
};

const index = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

export { index$a as a, index$9 as b, index$8 as c, index$7 as d, index$6 as e, index$5 as f, index$4 as g, index$3 as h, index$b as i, index$2 as j, index$1 as k, index as l };
