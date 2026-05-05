// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LBJToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("LBJ Coin", "LBJ") Ownable(initialOwner) {}

    // Only the Staking Pool (or the Bank) should be allowed to mint rewards
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}