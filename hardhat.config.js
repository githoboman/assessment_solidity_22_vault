require("@nomicfoundation/hardhat-toolbox");


const SEPOLIA_RPC_URL = "https://etheureum-sepolia-rpc.allthatnode.com";
const PRIVATE_KEY = "";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
