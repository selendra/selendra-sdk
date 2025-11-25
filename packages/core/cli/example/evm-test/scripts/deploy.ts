import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MyToken...");

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();

  await token.waitForDeployment();

  console.log(`MyToken deployed to: ${await token.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
