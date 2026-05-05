import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  
  solidity: {
    // PERMANENT FIX: Everything must be inside the 'profiles' block
    profiles: {
      // The 'default' profile is mandatory and used for 'npx hardhat compile'
      default: {
        compilers: [
          {
            version: "0.8.24",
            settings: {
              evmVersion: "cancun",
              optimizer: { enabled: true, runs: 200 },
            },
          }
        ],
      },
      // The 'production' profile is used by Hardhat Ignition for deployments
      production: {
        compilers: [
          {
            version: "0.8.24",
            settings: {
              evmVersion: "cancun",
              optimizer: { enabled: true, runs: 200 },
            },
          }
        ],
      }
    }
  },
  networks: {
    hardhat: {
      type: "edr-simulated", // Mandatory property for Hardhat 3
      hardfork: "cancun",    // Supports the mcopy opcode
    },
    localhost: {
      type: "http",          // Mandatory for URL-based networks
      url: "http://127.0.0.1:8545",
    },
  },
});