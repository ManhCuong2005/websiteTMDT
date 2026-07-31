import fs from "node:fs";
import path from "node:path";
import { Contract, JsonRpcProvider, hexlify, randomBytes } from "ethers";

const root = path.resolve(import.meta.dirname, "..");
const artifact = JSON.parse(
  fs.readFileSync(path.join(root, "artifacts", "OrderPayment.json"), "utf8"),
);
const deployment = JSON.parse(
  fs.readFileSync(path.join(root, "deployments", "ganache-1337.json"), "utf8"),
);

const provider = new JsonRpcProvider(deployment.rpcUrl);
const payer = await provider.getSigner(1);
const contract = new Contract(deployment.contractAddress, artifact.abi, payer);
const orderId = hexlify(randomBytes(32));
const amount = 1_000_000_000_000n;
const balanceAt = async (block = "latest") =>
  BigInt(await provider.send("eth_getBalance", [deployment.merchantAddress, block]));
const merchantBalanceBefore = await balanceAt();

const transaction = await contract.payOrder(orderId, { value: amount });
const receipt = await transaction.wait();
const merchantBalanceAfter = await balanceAt();
const record = await contract.payments(orderId);

const checks = {
  receipt: receipt.status === 1,
  payer: record.payer.toLowerCase() === (await payer.getAddress()).toLowerCase(),
  recordedAmount: record.amount === amount,
  merchantReceived: merchantBalanceAfter - merchantBalanceBefore === amount,
};
if (Object.values(checks).some((value) => !value)) {
  throw new Error(`OrderPayment smoke test failed: ${JSON.stringify({
    checks,
    merchantBalanceBefore: merchantBalanceBefore.toString(),
    merchantBalanceAfter: merchantBalanceAfter.toString(),
    recordedAmount: record.amount.toString(),
  })}`);
}

console.log(JSON.stringify({
  status: "PASS",
  orderId,
  transactionHash: transaction.hash,
  payer: record.payer,
  merchant: deployment.merchantAddress,
  amountWei: amount.toString(),
  blockNumber: receipt.blockNumber,
}, null, 2));
