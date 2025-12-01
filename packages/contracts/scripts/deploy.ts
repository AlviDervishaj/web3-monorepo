import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat, sepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const network = process.env.NETWORK || 'sepolia';
  const rpcUrl =
    process.env.RPC_URL ||
    (network === 'sepolia' ? process.env.SEPOLIA_RPC_URL ?? '' : 'http://127.0.0.1:8545');
  const privateKey = process.env.PRIVATE_KEY || '';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  if (!rpcUrl) {
    throw new Error('RPC_URL (or SEPOLIA_RPC_URL) is required for Sepolia deployments');
  }

  const chain = network === 'sepolia' ? sepolia : hardhat;
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  console.log('Deploying contracts...');
  console.log('Network:', network);
  console.log('Deployer address:', account.address);

  // Read contract artifacts
  const factoryArtifact = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../artifacts/contracts/CrowdfundingFactory.sol/CrowdfundingFactory.json'),
      'utf-8'
    )
  );

  // Deploy Factory
  console.log('\nDeploying CrowdfundingFactory...');
  const hash = await walletClient.deployContract({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode as `0x${string}`,
  });

  console.log('Transaction hash:', hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const factoryAddress = receipt.contractAddress;

  if (!factoryAddress) {
    throw new Error('Factory deployment failed - no contract address');
  }

  console.log('CrowdfundingFactory deployed to:', factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    network,
    factoryAddress,
    deployer: account.address,
    transactionHash: hash,
    timestamp: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, '../deployments', `${network}.json`);
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log('\nDeployment info saved to:', deploymentPath);
  console.log('\nDeployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Update web app addresses if present
  const webAppAddressesPath = path.join(__dirname, '../../shared/src/contracts/addresses.ts');
  if (fs.existsSync(webAppAddressesPath)) {
    let addressesContent = fs.readFileSync(webAppAddressesPath, 'utf-8');
    
    if (network === 'localhost') {
      addressesContent = addressesContent.replace(
        /factory: '0x[0-9a-fA-F]+' as Address/,
        `factory: '${factoryAddress}' as Address`
      );
    } else if (network === 'sepolia') {
      addressesContent = addressesContent.replace(
        /sepolia: \{[\s\S]*?factory: '0x[0-9a-fA-F]+'/,
        `sepolia: {\n    factory: '${factoryAddress}' as Address`
      );
    }

    fs.writeFileSync(webAppAddressesPath, addressesContent);
    console.log('\nWeb app addresses updated!');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

