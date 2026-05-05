import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletABI from './abi/Wallet.json';
import NFTABI from './abi/LBJMembership.json';
import TokenABI from './abi/LBJToken.json';


const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const NFT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";     
const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // The LBJ Coin

function App() {
  const [account, setAccount] = useState("");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [totalContractEth, setTotalContractEth] = useState("0");
  const [userWalletBalance, setUserWalletBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [membershipNFT, setMembershipNFT] = useState(null);
  const [stakedAmount, setStakedAmount] = useState("0");
  const [pendingRewards, setPendingRewards] = useState("0");
  const [lbjBalance, setLbjBalance] = useState("0");
  const [stakeInput, setStakeInput] = useState("");
  const [totalVaultTVL, setTotalVaultTVL] = useState("0");

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask!");
    }
  };

  const updateBalance = async () => {
    if (!window.ethereum || !account) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, provider);
    const nftContract = new ethers.Contract(NFT_ADDRESS, NFTABI.abi, provider);

    // Bank Data
    const mySlice = await contract.balances(account);
    setVaultBalance(ethers.formatEther(mySlice));

    const totalEth = await provider.getBalance(CONTRACT_ADDRESS);
    setTotalContractEth(ethers.formatEther(totalEth));

    const walletBal = await provider.getBalance(account);
    setUserWalletBalance(ethers.formatEther(walletBal));

    const contractOwner = await contract.owner();
    setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());

    // NFT Data
    const nftCount = await nftContract.balanceOf(account);
    if (nftCount > 0) {
      const tokenId = 0; // Simplified for demo
      const uri = await nftContract.tokenURI(tokenId);
      const json = JSON.parse(atob(uri.split(",")[1]));
      setMembershipNFT(json);
    } else {
      setMembershipNFT(null);
    }
  };

  useEffect(() => {
    if (account) updateBalance();
  }, [account]);

  const handleAction = async (actionType) => {
  if (!amount && actionType !== 'claim' && actionType !== 'fees' && actionType !== 'claimRewards') {
    alert("Please enter an amount");
    return;
  }

  switch(actionType) {
    case 'deposit': await depositEth(); break;
    case 'withdraw': await withdrawEth(); break;
    case 'claim': await claimNFT(); break;
    case 'fees': await collectFees(); break;
    case 'stake': await stakeEth(amount); break; // Pass amount from input
    case 'claimRewards': await claimRewards(); break;
    default: break;
  }
};

  const stakeEth = async (amount) => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;

      
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      
      const walletContract = new ethers.Contract(
        CONTRACT_ADDRESS, 
        WalletABI.abi, 
        signer
      );

      console.log("Staking ETH...");
      
      
      const tx = await walletContract.stake({ 
        value: ethers.parseEther(amount) 
      });

      await tx.wait();
      console.log("Stake successful!");
      
      // Refresh Functions
      await fetchBalances(); 
    } catch (err) {
      console.error("Stake Error:", err);
      alert("Stake failed! Check console for details.");
    }
  };

  const depositEth = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);

      console.log("Depositing...");
      const tx = await walletContract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      
      setAmount(""); // Clear input
      await fetchBalances(); // Refresh numbers
    } catch (err) {
      console.error("Deposit Error:", err);
      alert("Deposit failed: " + (err.data?.message || err.message));
    }
  };


const withdrawEth = async () => {
  try {
    const { ethereum } = window;
    if (!ethereum) return;

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);

    console.log("Withdrawing...");
    const tx = await walletContract.withdraw(ethers.parseEther(amount));
    await tx.wait();

    setAmount(""); 
    await fetchBalances(); 
  } catch (err) {
    console.error("Withdraw Error:", err);
    alert("Withdraw failed: " + (err.data?.message || err.message));
  }
};

const claimNFT = async () => {
  try {
    const { ethereum } = window;
    if (!ethereum) return;

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);

    console.log("Claiming NFT...");
    const tx = await walletContract.claimMembership();
    await tx.wait();

    alert("Membership Claimed! Refreshing...");
    window.location.reload(); // Hard refresh to show the new SVG
  } catch (err) {
    console.error("NFT Error:", err);
    alert("Claim failed! Ensure you have 0.1 ETH in the Vault.");
  }
};

const collectFees = async () => {
  try {
    const { ethereum } = window;
    if (!ethereum) return;

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);

    console.log("Collecting fees...");
    const tx = await walletContract.withdrawFees();
    await tx.wait();

    alert("Fees collected successfully!");
    await fetchBalances();
  } catch (err) {
    console.error("Fee Error:", err);
    alert("Only the contract owner can collect fees.");
  }
};

  const claimRewards = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return;

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);

      console.log("Claiming rewards...");
      const tx = await walletContract.claimRewards();
      
      // Wait for the block to be mined
      await tx.wait();

      // FORCE UI RESET
      // We set the pending rewards to 0 immediately so the ticker "starts over"
      setPendingRewards("0");

      //Wait 1 second for the node to sync state
      setTimeout(async () => {
        await fetchBalances();
        console.log("UI Synced with Blockchain");
      }, 1000);

    } catch (err) {
      console.error("Claim Error:", err);
    }
  };

  const fetchBalances = async () => {
    // If no wallet is connected, stop here
    if (!account || !window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, provider);
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TokenABI.abi, provider);

      //User's Personal ETH in MetaMask
      const ethBal = await provider.getBalance(account);
      setUserWalletBalance(ethers.formatEther(ethBal));

      //User's Specific Mapping in the Vault
      const vltBal = await walletContract.balances(account);
      setVaultBalance(ethers.formatEther(vltBal));

      //Total ETH Physically held by the Contract (TVL)
      const tvl = await provider.getBalance(CONTRACT_ADDRESS);
      setTotalVaultTVL(ethers.formatEther(tvl));

      //User's LBJ Token Wallet Balance
      const lbjBal = await tokenContract.balanceOf(account);
      setLbjBalance(ethers.formatUnits(lbjBal, 18));

      //Calculate Pending Rewards (Live Ticker Logic)
      const startTime = await walletContract.stakingTimestamp(account);
      if (vltBal > 0n && startTime > 0n) {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const timeElapsed = now - startTime;
        const pending = (vltBal * timeElapsed * 10n) / 3600n;
        setPendingRewards(ethers.formatUnits(pending, 18));
      } else {
        setPendingRewards("0");
      }
      
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const updateStakingInfo = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const walletContract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, provider);
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TokenABI.abi, provider);

    // Get staked balance from Wallet.sol
    const balance = await walletContract.balances(currentAccount);
    setStakedAmount(ethers.utils.formatEther(balance));

    // Get earned tokens from LBJToken.sol
    const lbj = await tokenContract.balanceOf(currentAccount);
    setLbjBalance(ethers.utils.formatUnits(lbj, 18));
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", backgroundColor: "#121212", color: "white", fontFamily: "sans-serif", padding: "40px" }}>
      <h1 style={{ fontSize: "3.5rem", fontWeight: "bold" }}>LBJ Bank</h1>
      
      {!account ? (
        <button onClick={connectWallet} style={{ padding: "12px 24px", cursor: "pointer", borderRadius: "8px" }}>Connect Wallet</button>
      ) : (
        <div style={{ width: "100%", maxWidth: "450px", backgroundColor: "#1e1e1e", padding: "30px", borderRadius: "20px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
          
          <p style={{ fontSize: "0.8rem", color: "#888" }}>Account: {account}</p>
          
          {/* Vault Balance Display */}
        <div style={{ background: "#2a2a2a", padding: "15px", borderRadius: "12px", margin: "15px 0" }}>
          <p style={{ margin: "5px 0", fontSize: "0.9rem" }}>💰 Wallet: <span style={{ fontWeight: "bold" }}>{userWalletBalance} ETH</span></p>
          
          <div style={{ marginTop: "10px", borderTop: "1px solid #444", paddingTop: "10px" }}>
            <p style={{ margin: "5px 0", fontSize: "0.9rem", color: "#4caf50" }}>🏦 Your Deposit: <strong>{vaultBalance} ETH</strong></p>
            <p style={{ margin: "5px 0", fontSize: "0.75rem", color: "#888" }}>🏛️ Total Bank TVL: {totalVaultTVL} ETH</p>
          </div>
        </div>

          <input 
            type="number" 
            placeholder="ETH Amount" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", background: "#121212", color: "white", border: "1px solid #444", boxSizing: "border-box" }} 
          />
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <button onClick={() => handleAction('deposit')} style={{ flex: 1, padding: "12px", background: "#3f51b5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Deposit</button>
            <button onClick={() => handleAction('withdraw')} style={{ flex: 1, padding: "12px", background: "#f44336", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Withdraw</button>
          </div>

          <div style={{ borderTop: "1px solid #333", paddingTop: "20px", marginTop: "10px" }}>
            <h3 style={{ color: "#FFD700", marginBottom: "10px" }}>Staking Pool</h3>
            
            <div style={{ background: "#2a2a2a", padding: "15px", borderRadius: "12px", marginBottom: "15px" }}>
              <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "5px" }}>Total LBJ Owned: {lbjBalance}</p>
              <p style={{ fontSize: "1rem", margin: 0 }}>
                ⭐ Claimable: <span style={{ color: "#FFD700", fontWeight: "bold" }}>{pendingRewards} LBJ</span>
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => handleAction('stake')} style={{ flex: 1, padding: "12px", background: "#673ab7", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Stake</button>
              <button onClick={() => handleAction('claimRewards')} style={{ flex: 1, padding: "12px", background: "none", color: "#FFD700", border: "1px solid #FFD700", borderRadius: "8px", cursor: "pointer" }}>Claim Rewards</button>
            </div>
          </div>

          <div style={{ marginTop: "25px", padding: "15px", backgroundColor: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", fontSize: "0.75rem", color: "#aaa", lineHeight: "1.4", border: "1px solid #333" }}>
            <h4 style={{ color: "#FFD700", marginBottom: "8px", marginTop: "0" }}>Reward Logic</h4>
            <p>Earn 10 LBJ per hour for every 1 ETH in the vault.</p>
            <div style={{ background: "#000", padding: "8px", borderRadius: "6px", color: "#4caf50", fontFamily: "monospace", textAlign: "center", margin: "8px 0" }}>
              Rewards = (Staked ETH × Seconds × 10) / 3600
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;