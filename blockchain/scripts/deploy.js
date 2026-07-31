import fs from "node:fs";
import path from "node:path";
import { ContractFactory, JsonRpcProvider } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifactPath = path.join(root, "artifacts", "OrderPayment.json");
const deploymentDir = path.join(root, "deployments");
const rpcUrl = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";
const expectedChainId = BigInt(process.env.GANACHE_CHAIN_ID || "1337");
const merchantAddress =
  process.env.MERCHANT_WALLET_ADDRESS ||
  "0x64def5FBD89a8f59eBE6917Bf9460e85c258c725";

if (!fs.existsSync(artifactPath)) {
  throw new Error("Missing artifact. Run npm run compile first.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const provider = new JsonRpcProvider(rpcUrl);
const network = await provider.getNetwork();
if (network.chainId !== expectedChainId) {
  throw new Error(`Wrong chain ID: expected ${expectedChainId}, received ${network.chainId}`);
}

const signer = await provider.getSigner(0);
const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
const contract = await factory.deploy(merchantAddress);
await contract.waitForDeployment();

const contractAddress = await contract.getAddress();
const deploymentTransaction = contract.deploymentTransaction();
const deployment = {
  rpcUrl,
  chainId: Number(network.chainId),
  merchantAddress,
  contractAddress,
  deployerAddress: await signer.getAddress(),
  transactionHash: deploymentTransaction?.hash,
  payOrderSelector: `0x${artifact.methodIdentifiers["payOrder(bytes32)"]}`,
  deployedAt: new Date().toISOString(),
};

fs.mkdirSync(deploymentDir, { recursive: true });
fs.writeFileSync(
  path.join(deploymentDir, `ganache-${network.chainId}.json`),
  JSON.stringify(deployment, null, 2),
);

console.log(JSON.stringify(deployment, null, 2));
console.log("\nAdd these values to config.local.bat:");
console.log(`set "BLOCKCHAIN_CONTRACT_ADDRESS=${contractAddress}"`);
console.log(`set "BLOCKCHAIN_PAYMENT_SELECTOR=${deployment.payOrderSelector}"`);
