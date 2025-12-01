import { createPublicClient, http } from 'viem';
import { hardhat, sepolia } from 'viem/chains';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const deploymentDir = path.join(__dirname, '../deployments');
const factoryArtifactPath = path.join(
  __dirname,
  '../abis/CrowdfundingFactory.json',
);

type DeploymentInfo = {
  network: string;
  factoryAddress: `0x${string}`;
};

const readDeploymentFile = (network: string): DeploymentInfo | null => {
  const filePath = path.join(deploymentDir, `${network}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return {
    network: parsed.network,
    factoryAddress: parsed.factoryAddress,
  };
};

async function main() {
  const network = process.env.NETWORK || 'sepolia';
  const rpcUrl =
    process.env.RPC_URL ||
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
    (network === 'localhost' ? 'http://127.0.0.1:8545' : '');

  if (!rpcUrl) {
    throw new Error(
      'RPC_URL or NEXT_PUBLIC_SEPOLIA_RPC_URL must be provided for the health check',
    );
  }

  const deploymentFile = readDeploymentFile(network);
  const deploymentAddress = deploymentFile?.factoryAddress;
  const envAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as
    | `0x${string}`
    | undefined;

  const factoryAddress = envAddress || deploymentAddress;

  if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(
      `Factory address missing. Provide NEXT_PUBLIC_FACTORY_ADDRESS or ensure deployments/${network}.json is populated.`,
    );
  }

  if (envAddress && deploymentAddress && envAddress.toLowerCase() !== deploymentAddress.toLowerCase()) {
    throw new Error(
      `Factory address mismatch: env=${envAddress} deployment=${deploymentAddress}`,
    );
  }

  const chain = network === 'localhost' ? hardhat : sepolia;
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const factoryArtifact = JSON.parse(fs.readFileSync(factoryArtifactPath, 'utf-8'));

  console.log(`Checking factory ${factoryAddress} on ${network}...`);

  // Simple read to ensure contract exists and responds
  const campaigns = await publicClient.readContract({
    address: factoryAddress,
    abi: factoryArtifact.abi,
    functionName: 'getAllCampaigns',
  });

  console.log(
    `Factory responded with ${Array.isArray(campaigns) ? campaigns.length : 0} campaigns.`,
  );
  console.log('Contracts check passed ✅');
}

main().catch((error) => {
  console.error('Contracts check failed ❌');
  console.error(error);
  process.exit(1);
});

