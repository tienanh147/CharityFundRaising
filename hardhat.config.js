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
    // rinkeby: {
    //   url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
    //   accounts: [`0x${ACCOUNT_PRIVATE_KEY}`]
    // }
  },
};