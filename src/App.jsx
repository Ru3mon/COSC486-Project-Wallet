import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletABI from './abi/Wallet.json';

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  const [account, setAccount] = useState("");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [totalContractEth, setTotalContractEth] = useState("0");
  const [userWalletBalance, setUserWalletBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [isOwner, setIsOwner] = useState(false);

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

    const mySlice = await contract.balances(account);
    setVaultBalance(ethers.formatEther(mySlice));

    const totalEth = await provider.getBalance(CONTRACT_ADDRESS);
    setTotalContractEth(ethers.formatEther(totalEth));

    const walletBal = await provider.getBalance(account);
    setUserWalletBalance(ethers.formatEther(walletBal));

    const contractOwner = await contract.owner();
    setIsOwner(contractOwner.toLowerCase() === account.toLowerCase());
  };

  useEffect(() => {
    if (account) updateBalance();
  }, [account]);

  const handleAction = async (method) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, WalletABI.abi, signer);
      
      let tx;
      if (method === 'deposit') {
        tx = await contract.deposit({ value: ethers.parseEther(amount) });
      } else if (method === 'withdraw') {
        tx = await contract.withdraw(ethers.parseEther(amount));
      } else if (method === 'fees') {
        tx = await contract.withdrawFees();
      }
      
      await tx.wait();
      setAmount("");
      updateBalance();
    } catch (err) {
      console.error(err);
      alert("Transaction failed! Check console.");
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh", 
      backgroundColor: "#121212", // Dark background to match your screenshot
      color: "white", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px"
    }}>
      
      {/* Fixed Title with proper line-height and spacing */}
      <h1 style={{ 
        fontSize: "3rem", 
        marginBottom: "20px", 
        textAlign: "center", 
        lineHeight: "1.2",
        fontWeight: "bold" 
      }}>
        LBJ Bank
      </h1>
      
      {!account ? (
        <button 
          onClick={connectWallet} 
          style={{ padding: "12px 24px", fontSize: "1rem", cursor: "pointer", borderRadius: "8px" }}
        >
          Connect Wallet
        </button>
      ) : (
        <div style={{ 
          width: "100%", 
          maxWidth: "450px", 
          backgroundColor: "#1e1e1e", 
          padding: "30px", 
          borderRadius: "16px", 
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)" 
        }}>
          <p style={{ fontSize: "0.9rem", color: "#aaa", marginBottom: "20px" }}>
            <strong>Account:</strong> {account.slice(0,6)}...{account.slice(-4)}
          </p>
          
          <div style={{ background: "#2a2a2a", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
            <p style={{ margin: "5px 0" }}>💰 <strong>My Wallet:</strong> {userWalletBalance} ETH</p>
            <p style={{ margin: "5px 0" }}>🏦 <strong>LBJ Vault:</strong> {vaultBalance} ETH</p>
            <div style={{ height: "1px", background: "#444", margin: "10px 0" }}></div>
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>Total Bank Liquidity: {totalContractEth} ETH</p>
          </div>

          <input 
            type="number" 
            placeholder="Amount in ETH" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)} 
            style={{ 
              padding: "12px", 
              width: "100%", 
              marginBottom: "15px", 
              borderRadius: "8px", 
              border: "1px solid #444", 
              backgroundColor: "#121212", 
              color: "white",
              boxSizing: "border-box"
            }}
          />
          
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => handleAction('deposit')} 
              style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "#3f51b5", color: "white", border: "none", cursor: "pointer" }}
            >
              Deposit
            </button>
            <button 
              onClick={() => handleAction('withdraw')} 
              style={{ flex: 1, padding: "12px", borderRadius: "8px", backgroundColor: "#f44336", color: "white", border: "none", cursor: "pointer" }}
            >
              Withdraw (1%)
            </button>
          </div>

          {isOwner && (
            <div style={{ marginTop: "25px", paddingTop: "15px", borderTop: "1px solid #444" }}>
              <p style={{ color: "#4caf50", fontSize: "0.8rem", marginBottom: "10px" }}>LBJ Admin Dashboard</p>
              <button 
                onClick={() => handleAction('fees')} 
                style={{ width: "100%", padding: "12px", borderRadius: "8px", backgroundColor: "#4caf50", color: "white", border: "none", cursor: "pointer" }}
              >
                Collect Service Fees
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;