import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  // Hardhat 3 mandatory plugin registration
  plugins: [hardhatToolboxMochaEthers],
  solidity: "0.8.20",
});