import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

export const transport = fallback(
  [
    http(
      `https://eth-mainnet.g.alchemy.com/v2/JwqJabUlNej1aLoQQ8AY2iRr7yGxEdWs`,
    ),
    http(`https://rpc.mevblocker.io/fast`),
    http(`https://ethereum.publicnode.com`),
    http(`https://free-eth-node.com/api/eth`),
    http(`https://go.getblock.io/cc615130d7f84537b0940e7e5870594f`),
  ],
  // { rank: true },
);

export const publicClient = createPublicClient({
  chain: mainnet,
  transport,
});
