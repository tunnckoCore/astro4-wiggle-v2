import { isAddress as isEthAddress, stringify } from "viem";
import { publicClient } from "./viem";
import { normalize } from "viem/ens";

export const queryCache = new Map();
export const respCache = new Map();
export const txnsCache = new Map();

export function json(data: any, options: any) {
  let jsonStr = null;

  try {
    jsonStr = JSON.stringify(data);
  } catch (e) {
    jsonStr = stringify(data);
  }

  return new Response(jsonStr, {
    ...options,
    headers: { ...options?.headers, "Content-Type": "application/json" },
  });
}

export function inputChecker(input: any) {
  const isTxHash = input.startsWith("0x") && input.length === 66;
  const isNumber = !isNaN(Number(input));
  const isAddress = isEthAddress(input) || /^0x[a-z0-9]{40}$/i.test(input);
  const isHandle = /^[a-z0-9]{2,}$/.test(input);
  const isBasic = /^[\s\S\w\w]{2,}$/.test(input);

  // prettier-ignore
  const isSha = !input.startsWith("0x") && /[a-z0-9]/i.test(input) && input.length === 64;

  return {
    isHandle,
    isTxHash,
    isNumber,
    isAddress,
    isSha,
    isBasic,
  };
}

export async function cacheChecker<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  let res = null;

  if (txnsCache.has(key)) {
    console.log("cache hit for ", key);
    res = txnsCache.get(key);
  } else {
    console.log("cache miss for ", key);
    res = await tryCatchFlow(() => fn());
    if (res) {
      txnsCache.set(key, res);
    }
  }

  return res;
}

export async function fetchProfile(address: string) {
  const url = `https://api.ethscriptions.com/api/ethscriptions/filtered?mimetype=application%2Fvnd.esc.user.profile%2Bjson&creator=${address}&sort_order=desc`;
  const resp = await tryCatchFlow(() => fetch(url).then((x) => x.json()));

  if (!resp || resp?.error) {
    return null;
  }

  return resp.ethscriptions[0];
}

export async function createResponse(x: string, input = null, url = null) {
  const address = x.toLowerCase();
  const skip = url && url.searchParams.get("skipProfile");
  const eth = skip ? null : await fetchProfile(address);

  if (!eth) {
    return { address, input, profile: null };
  }

  const parsed = parseDataUri(eth.content_uri);
  const rest = await tryCatchFlow(() => JSON.parse(parsed.data));

  const profile = {
    // @ts-ignore next quiet
    ...(rest ? rest : {}),
    sha: eth.sha,
    transactionHash: eth.transaction_hash,
    updatedAt: eth.creation_timestamp,
  };

  return { address, input, profile };
}

export async function resolveRedirectPath(
  input: string,
  url: URL,
  skipNumber = false,
) {
  const query = input.toLowerCase();
  const q = inputChecker(query);

  if (q.isTxHash) {
    return `/tx/${query}`;
  }

  if (skipNumber === false && q.isNumber && !q.isAddress) {
    return `/tx/${query}`;
  }

  if (q.isSha) {
    const res = await resolveBySha(query, url).then((x) => x.json());

    if (res.error) {
      return `/?error=${res.error}`;
    }

    return `/tx/${res.data.transactionHash}`;
  }

  if (q.isAddress) {
    return `/address/${query}`;
  }

  const address = await tryCatchFlow(() =>
    publicClient.getEnsAddress({
      name: normalize(query),
    }),
  );

  if (address) {
    return `/address/${address}`;
  }

  let sha = null;
  let resp = {} as any;

  if (queryCache.has(query)) {
    console.log("query hit");
    sha = queryCache.get(query);
  } else {
    sha = await sha256(`data:,${query}`);
    console.log("query new");
    queryCache.set(query, sha);
  }

  if (respCache.has(sha)) {
    console.log("resp hit");
    resp = respCache.get(sha);
  } else {
    console.log("resp new 1");
    resp = await cacheChecker("own-exists-" + sha, () =>
      fetch(`${url.origin}/api/exists?sha=${sha}`).then((x) => x.json()),
    );

    if (!resp || resp.error) {
      return `/?error=${resp?.error || "Something went while checking own api for sha"}`;
    }

    console.log("resp after own /api/exists", resp, sha, q);
  }

  if (resp.error) {
    return `/?error=${resp?.error || "Something went wrong"}`;
  }

  if (resp.result) {
    respCache.set(sha, resp);

    return q.isHandle || q.isAddress || q.isBasic
      ? `/address/${resp.data.currentOwner}`
      : `/tx/${resp.data.transactionHash}`;
  }

  return `/?error=Nothing found`;
}

export async function resolveBySha(
  input: string,
  url?: any,
): Promise<Response> {
  const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/filtered?sha=${input}`;
  const resp = await tryCatchFlow(() =>
    fetch(upstreamUrl).then((x) => x.json()),
  );

  if (!resp || (resp && resp.error)) {
    return json(
      { error: "An upstream failure requesting: " + upstreamUrl },
      { status: 200 },
    );
  }

  if (resp.total_count === 1) {
    const newUrl = `${url?.origin || ""}/api/ethscriptions/${resp.ethscriptions[0].transaction_hash}${url.search}`;
    return fetch(newUrl);
  }

  return json({ data: { ...resp } }, { status: 200 });
}

export async function getEthscription(input: any, url: URL) {
  const q = inputChecker(input);

  if (q.isNumber) {
    const upstreamUrl = `https://api.ethscriptions.com/api/ethscriptions/${input}`;
    const resp = await cacheChecker(upstreamUrl + "-core", () =>
      fetch(upstreamUrl).then((x) => x.json()),
    );

    if (!resp || (resp && resp.error)) {
      return { error: "An upstream failure requesting: " + upstreamUrl };
    }

    input = resp.transaction_hash;
  }

  if (inputChecker(input).isTxHash) {
    const withContent = url.searchParams.get("withContent");
    const withCurrentOwner = url.searchParams.get("withCurrentOwner");

    url.searchParams.set("withInput", "1");

    const resp = await getTransaction(input as any, url);

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

    const data = {
      creatorAddress,
      initialOwnerAddress,
      ...txn,
      sha,
      ...content,
    };

    return { data };
  }

  return { error: "Ethscription Not Found" };
}
export async function getTransaction(hash: any, url: URL) {
  console.log("GETTING BARE TRANSACTION:", hash);

  try {
    let tx = await cacheChecker(hash + "-txns", () =>
      publicClient.getTransaction({ hash }),
    );

    tx =
      tx ||
      (await cacheChecker(hash + "-onchain-fail-trying-official-api", () =>
        fetch(`https://api.ethscriptions.com/api/ethscriptions/${hash}`).then(
          (x) => x.json(),
        ),
      ));

    if (!tx) {
      throw new Error(
        "No such transaction: neither on-chain, nor on official api",
      );
    }

    const block = await cacheChecker(hash + "-block", () =>
      publicClient.getBlock({ blockNumber: tx.blockNumber }),
    );

    const txReceipt = await cacheChecker(hash + "-receipt", () =>
      publicClient.getTransactionReceipt({ hash }),
    );

    if (!block || !txReceipt) {
      throw new Error("Failure in some RPC connections");
    }

    const withInput = url.searchParams.get("withInput");

    const {
      blockHash,
      blockNumber,
      from: fromAddress,
      to: toAddress,
      gasUsed,
      gasPrice,
      transactionHash,
      transactionIndex,
      input,
      value: transactionValue,
      nonce: transactionNonce,
      status: transactionStatus,
    } = { ...tx, ...txReceipt };

    const transactionFee = BigInt(gasUsed) * BigInt(gasPrice);
    const ts = block.timestamp * BigInt(1000);
    const dataProto = "646174613a";

    // const esip3creation = `event ethscriptions_protocol_CreateEthscription(address indexed,string)`;
    // hexToUtf8(input)

    // Converting shenanigans... (╯°□°）╯︵ ┻━┻
    const inputUtf8 = hexToUtf8(input);
    const esip3log = txReceipt.logs.find((log) =>
      log?.data.includes(dataProto),
    );
    const txInput = esip3log?.data.slice(esip3log?.data?.indexOf(dataProto));
    const txnInput = inputUtf8.slice(inputUtf8.indexOf(`data:`));
    const transactionInput = toHexString(
      txnInput.includes(`data:`) ? txnInput : hexToUtf8(txInput),
    );

    // console.log({
    //   esip3log,
    //   txInput,
    //   txnInput,
    //   transactionInput,
    //   isData: txnInput.includes(`data:`),
    // });
    const result = {
      timestamp: block.timestamp,
      createdAt: new Date(Number(ts)).toISOString(),
      fromAddress,
      toAddress,
      gasUsed,
      gasPrice,
      blockDifficulty: block.difficulty,
      blockHash,
      blockNumber,
      transactionHash,
      transactionIndex,
      transactionValue,
      transactionNonce,
      transactionFee,
      transactionStatus,
      ...(withInput ? { transactionInput: "0x" + transactionInput } : {}),
    };

    if (Object.keys(result).length === 0) {
      return { error: "Transaction/chain fvck up" };
    }

    return { data: result };
  } catch (e) {
    return { error: "Something went wrong, huge failure: " + e };
  }
}

export async function sha256(msg: string | Uint8Array, algo?: string) {
  const hashBuffer = await crypto.subtle.digest(
    algo || "SHA-256",
    typeof msg === "string" ? new TextEncoder().encode(msg) : msg,
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export async function tryCatchFlow<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    console.log("tryCatchFlow er:", e);
    return null;
  }
}

export function toHexString(x: string | Uint8Array) {
  const msg = new TextDecoder().decode(
    typeof x === "string" ? new TextEncoder().encode(x) : x,
  );

  return msg
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

export function fromHexString(x: any) {
  return x
    .split("")
    .reduce((a, c, i) => (i % 2 ? a : [...a, x.slice(i, i + 2)]), [])
    .map((x) => String.fromCharCode(parseInt(x, 16)))
    .join("")
    .replace(/\0/g, "");
}

export function hexToUtf8(hexString: string) {
  if (hexString.indexOf("0x") === 0) {
    hexString = hexString.slice(2);
  }

  const bytes = new Uint8Array(hexString.length / 2);

  for (let index = 0; index < bytes.length; index++) {
    const start = index * 2;
    const hexByte = hexString.slice(start, start + 2);
    const byte = Number.parseInt(hexByte, 16);
    if (Number.isNaN(byte) || byte < 0) {
      throw new Error(
        `Invalid byte sequence ("${hexByte}" in "${hexString}").`,
      );
    }
    bytes[index] = byte;
  }

  let result = new TextDecoder().decode(bytes);
  return result.replace(/\0/g, "");
}

export function converterMapper(x: any, url: URL) {
  const withContent = url.searchParams.get("withContent");
  const removeAfterDot = (z) => {
    return z ? z.split(".")[0] : "0";
  };

  const item = {
    timestamp: String(new Date(x.creation_timestamp).getTime() / 1000),
    createdAt: x.creation_timestamp,
    creatorAddress: x.creator,
    initialOwnerAddress: x.initial_owner,
    gasUsed: removeAfterDot(x.gas_used),
    gasPrice: removeAfterDot(x.gas_price),
    blockNumber: String(x.block_number),
    transactionHash: x.transaction_hash,
    transactionIndex: x.transaction_index,
    transactionValue: removeAfterDot(x.value),
    transactionFee: removeAfterDot(x.transaction_fee),
    transactionStatus: "success",
    sha: x.sha,
    mimetype: x.mimetype,
  };

  const parseOptions = {
    ...Object.fromEntries(url.searchParams.entries()),
    defaultMimetype: "text/plain",
    defaultCharset: "utf-8",
  };

  const {
    input: uri,
    mimetype,
    base64: isBase64,
    ...parsed
  } = parseDataUri(x.content_uri, parseOptions);

  const content = {
    mimetype,
    charset: parsed.charset,
    isBase64,
    // @ts-ignore quiet pls
    isEsip6: parsed.params.rule === "esip6",
    isFacet: x.content_uri.includes("data:application/vnd.facet.tx+json"),
    params: parsed.params,
  };

  if (withContent) {
    // @ts-ignore next line
    content.uri = uri;
  }

  return { ...item, ...content };
}

export function parseDataUri(
  str: string,
  {
    paramDelimiter = ";",
    valueDelimiter = "=",
    defaultMimetype = "",
    defaultCharset = "us-ascii",
    decodeParams = true,
    decodeData = false,
    decodeBase64 = false,
  } = {},
) {
  // console.log({ str });

  const url = new URL(str?.trim());
  const protocol = url.protocol;
  const commaIndex = url.pathname.indexOf(",");
  let base64 = false;
  let mimetype = defaultMimetype || "";
  let charset = defaultCharset || "us-ascii";

  const params = url.pathname
    .slice(0, commaIndex)
    .split(paramDelimiter)
    .reduce((acc, param) => {
      const [key, value] = param.split(valueDelimiter);
      if (!key) {
        return acc;
      }
      if (/charset/i.test(key)) {
        charset = value;
        return acc;
      }
      if (/base64/i.test(key)) {
        base64 = true;
        return acc;
      }
      if (key.includes("/")) {
        mimetype = key;
        return acc;
      }

      const isNum = !Number.isNaN(Number(value));
      acc[key] = isNum
        ? Number(value)
        : decodeParams
          ? decodeURIComponent(value)
          : value;
      return acc;
    }, {});

  let data = url.pathname.slice(commaIndex + 1);
  data = decodeData ? decodeURIComponent(data) : data;
  data = decodeBase64 && base64 ? atob(data) : data;

  charset = mimetype.includes("json") ? "utf-8" : charset;

  const result = {
    input: str,
    protocol,
    base64,
    charset,
    mimetype,
    params,
    data,
  };

  return result;
}
