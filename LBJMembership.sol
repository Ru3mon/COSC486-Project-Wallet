// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LBJMembership is ERC721, Ownable {
    using Strings for uint256;
    uint256 public nextTokenId;

    constructor(address initialOwner) ERC721("LBJ Member", "LBJM") Ownable(initialOwner) {}

    function buildImage(uint256 _tokenId) public pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">',
            '<rect width="100%" height="100%" fill="#1a1a1a" rx="15"/>',
            '<text x="30" y="50" fill="#FFD700" font-family="Arial" font-size="24" font-weight="bold">LBJ BANK</text>',
            '<text x="30" y="90" fill="white" font-family="Arial" font-size="16">EXCLUSIVE MEMBERSHIP</text>',
            '<rect x="30" y="120" width="340" height="1" fill="#444"/>',
            '<text x="30" y="210" fill="#888" font-family="Courier" font-size="12">ID: #', _tokenId.toString(), '</text>',
            '<circle cx="350" cy="50" r="10" fill="#FFD700"/>',
            '</svg>'
        ));
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        _requireOwned(_tokenId);
        string memory imageValue = buildImage(_tokenId);
        string memory json = Base64.encode(bytes(string(abi.encodePacked(
            '{"name": "LBJ Elite Member #', _tokenId.toString(), '", ',
            '"description": "Official on-chain membership for the LBJ Bank ecosystem.", ',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(imageValue)), '"}'
        ))));
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function mintMemberNFT(address to) external onlyOwner {
        _safeMint(to, nextTokenId);
        nextTokenId++;
    }
}