// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./LBJToken.sol";
import "./LBJMembership.sol";


// --- LBJ BANK WALLET CONTRACT ---
contract Wallet {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public stakingTimestamp;
    
    address public owner;
    uint256 public constant SERVICE_FEE_PERCENT = 1;
    uint256 public constant REWARD_RATE_PER_HOUR = 10; 

    LBJMembership public nftContract;
    LBJToken public rewardToken;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event Staked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    constructor(address _nftAddress, address _rewardTokenAddress) {
        owner = msg.sender;
        nftContract = LBJMembership(_nftAddress);
        rewardToken = LBJToken(_rewardTokenAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the service owner can do this");
        _;
    }

    // Standard Vault Deposit
    function deposit() public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // --- STAKING LOGIC ---

    function stake() public payable {
        require(msg.value > 0, "Cannot stake 0 ETH");
        
        // Payout existing rewards before updating the balance/timestamp
        if (balances[msg.sender] > 0 && stakingTimestamp[msg.sender] > 0) {
            _mintRewards(msg.sender);
        }

        balances[msg.sender] += msg.value;
        stakingTimestamp[msg.sender] = block.timestamp;
        emit Staked(msg.sender, msg.value);
    }

    function claimRewards() public {
        require(balances[msg.sender] > 0, "No ETH staked");
        require(stakingTimestamp[msg.sender] > 0, "Staking not initialized");
        _mintRewards(msg.sender);
    }

    function _mintRewards(address _user) internal {
        uint256 timeElapsed = block.timestamp - stakingTimestamp[_user];
        if (timeElapsed > 0) {
            // Formula: (StakedAmount * TimeElapsed * Rate) / 3600 seconds
            uint256 rewards = (balances[_user] * timeElapsed * REWARD_RATE_PER_HOUR) / 3600;
            
            stakingTimestamp[_user] = block.timestamp; // Reset timer
            rewardToken.mint(_user, rewards);
            emit RewardsClaimed(_user, rewards);
        }
    }

    // --- MEMBERSHIP & WITHDRAWAL ---

    function claimMembership() public {
        require(balances[msg.sender] >= 0.1 ether, "Requires 0.1 ETH in LBJ Vault");
        require(nftContract.balanceOf(msg.sender) == 0, "Already a member!");
        nftContract.mintMemberNFT(msg.sender);
    }

    function withdraw(uint256 _amount) public {
        require(_amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        _mintRewards(msg.sender);

        uint256 fee = (_amount * SERVICE_FEE_PERCENT) / 100;
        uint256 amountToUser = _amount - fee;
        balances[msg.sender] -= _amount;

        (bool success, ) = msg.sender.call{value: amountToUser}("");
        require(success, "Transfer failed");
        emit Withdrawal(msg.sender, _amount);
    }

    function getBalance(address _user) public view returns (uint256) {
        return balances[_user];
    }

    receive() external payable {
        deposit();
    }
}