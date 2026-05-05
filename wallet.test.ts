import { expect } from "chai";
import { network } from "hardhat"; // Import 'network' instead of 'hre' or 'ethers'

describe("Wallet Contract", function () {
  let wallet: any;
  let user1: any;
  let ethers: any;

  beforeEach(async function () {
    // Hardhat 3 CRITICAL: Connect to the network to get the ethers toolset
    // This connection creates a fresh EDR-simulated blockchain for your test
    const connection = await network.connect(); 
    ethers = connection.ethers;

    const signers = await ethers.getSigners();
    user1 = signers[1];
    
    // Deploy using the Ethers v6 syntax standard in Hardhat 3
    const Wallet = await ethers.getContractFactory("Wallet");
    wallet = await Wallet.deploy();
  });

  it("Should allow a user to deposit ETH", async function () {
    const depositAmount = ethers.parseEther("1.0");
    await wallet.connect(user1).deposit({ value: depositAmount });
    
    const balance = await wallet.connect(user1).getBalance();
    expect(balance).to.equal(depositAmount);
  });
});