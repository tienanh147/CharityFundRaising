require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
// const { ACCOUNT_PRIVATE_KEY,ALCHEMY_KEY } = process.env;

module.exports = {
  solidity: "0.8.4",
  defaultNetwork: "localhost",
  paths: {
    artifacts: "./client/artifacts",
  },
  networks: {
    hardhat: {
      // url: process.env.RPC_URL,
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337

    },
    // testnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545",
    //   chainId: 97,
    //   gasPrice: 20000000000,
    //   accounts: ["01f8e4206705371a500dab8545186974abf8d1d697ffd6647353ceeb9cec6118"]
    // },


  },
};