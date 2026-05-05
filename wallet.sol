// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Wallet {
    // Changing to public creates an automatic "getter" for your React frontend
    mapping(address => uint256) public balances;
    
    // Monetization variables
    address public owner;
    uint256 public constant SERVICE_FEE_PERCENT = 1; 

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor() {
        // Set the person who deploys the contract as the service owner
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the service owner can do this");
        _;
    }

    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraws funds with a 1% service fee kept in the contract.
     */
    function withdraw(uint256 _amount) public {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");

        // 1. Calculate Fee (Monetization)
        uint256 fee = (_amount * SERVICE_FEE_PERCENT) / 100;
        uint256 amountToUser = _amount - fee;

        // 2. Update Ledger (Checks-Effects-Interactions pattern)
        balances[msg.sender] -= _amount;

        // 3. Transfer funds (minus fee)
        (bool success, ) = msg.sender.call{value: amountToUser}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, _amount);
    }

    /**
     * @dev Allows YOU (the owner) to withdraw the collected 1% fees.
     */
    function withdrawFees() public onlyOwner {
        uint256 totalFees = address(this).balance;
        // Check if there are any user funds left to avoid draining the vault
        // For a more complex app, you'd track fee totals in a separate variable
        (bool success, ) = owner.call{value: totalFees}("");
        require(success, "Fee withdrawal failed");
        
        emit FeesWithdrawn(owner, totalFees);
    }

    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
}