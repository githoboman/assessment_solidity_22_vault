const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying SimpleVault with account:", deployer.address);

  const SimpleVault = await hre.ethers.getContractFactory("SimpleVault");
  const vault = await SimpleVault.deploy();
  await vault.waitForDeployment();

  const address = await vault.getAddress();
  const deployTx = vault.deploymentTransaction();

  console.log("SimpleVault deployed to:", address);
  console.log("Deployment tx hash:", deployTx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
