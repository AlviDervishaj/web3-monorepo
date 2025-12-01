import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTRACTS = [
  { artifact: "Crowdfunding", source: "Crowdfunding.sol" },
  { artifact: "CrowdfundingFactory", source: "CrowdfundingFactory.sol" },
] as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, "..");
const artifactsDir = path.join(packageRoot, "artifacts", "contracts");
const outputDir = path.join(packageRoot, "abis");

fs.mkdirSync(outputDir, { recursive: true });

CONTRACTS.forEach(({ artifact, source }) => {
  const artifactPath = path.join(artifactsDir, source, `${artifact}.json`);

  if (!fs.existsSync(artifactPath)) {
    console.warn(`[abi-exporter] Missing artifact for ${artifact} at ${artifactPath}`);
    return;
  }

  const artifactJson = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const payload = {
    contractName: artifactJson.contractName ?? artifact,
    sourceName: artifactJson.sourceName ?? `contracts/${source}`,
    abi: artifactJson.abi,
    bytecode: artifactJson.bytecode,
  };

  const outputPath = path.join(outputDir, `${artifact}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`[abi-exporter] Wrote ${outputPath}`);
});

console.log(`[abi-exporter] Completed. Files available under ${outputDir}`);

