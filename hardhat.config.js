require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomicfoundation/hardhat-verify")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")
// require("@nomicfoundation/hardhat-ethers")
// "@nomicfoundation/hardhat-ethers": "^3.0.5", was in package.json

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://eth-sepolia"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
        },
    },
    // solidity: "0.8.8",
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: !false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
    },
    namedAccounts: {
        deployer: {
            default: 0,
            // 11155111: 1,
            // 4: 2,
            // 31337: 3
        },
        user: {
            default: 1,
            // 11155111: 2,
            // 4: 3,
            // 31337: 4
        },
    },
}
