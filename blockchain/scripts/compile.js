import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "contracts", "OrderPayment.sol");
const outputDir = path.join(root, "artifacts");
const source = fs.readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "OrderPayment.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    // Ganache Desktop 2.7.x does not support Shanghai's PUSH0 opcode.
    evmVersion: "paris",
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.methodIdentifiers"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors || [];
for (const item of errors) {
  const stream = item.severity === "error" ? console.error : console.warn;
  stream(item.formattedMessage);
}
if (errors.some((item) => item.severity === "error")) {
  process.exit(1);
}

const contract = output.contracts["OrderPayment.sol"].OrderPayment;
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "OrderPayment.json"),
  JSON.stringify(
    {
      contractName: "OrderPayment",
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}`,
      methodIdentifiers: contract.evm.methodIdentifiers,
    },
    null,
    2,
  ),
);

console.log("Compiled OrderPayment.sol");
console.log(`payOrder(bytes32) selector: 0x${contract.evm.methodIdentifiers["payOrder(bytes32)"]}`);
