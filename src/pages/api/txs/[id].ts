import type { APIRoute } from "astro";
import { publicClient } from "@/lib/viem";
import {
  cacheChecker,
  fromHexString,
  hexToUtf8,
  json,
  toHexString,
  tryCatchFlow,
  txnsCache,
} from "@/lib/utils";
// import { fromHex } from "viem";

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const hash = params.id as `0x${string}`;

  if (hash.startsWith("0x") && hash.length === 66) {
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
      return json(
        { error: "No such transaction: neither on-chain, nor on official api" },
        { status: 200 },
      );
    }

    const txReceipt = await cacheChecker(hash + "-receipt", () =>
      publicClient.getTransactionReceipt({ hash }),
    );

    const block = await cacheChecker(hash + "-block", () =>
      publicClient.getBlock({ blockNumber: tx.blockNumber }),
    );

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

    return json(
      {
        data: {
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
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=1000, immutable" },
      },
    );
  }

  return json({ error: "Transaction Not Found" }, { status: 200 });
};
