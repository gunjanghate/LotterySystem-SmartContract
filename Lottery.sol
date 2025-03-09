//SPDX-License-Identifier:MIT

pragma solidity ^0.8.19;

contract Lottery{
    address public manager;
    address payable[] public participants;

    constructor(){
        manager = msg.sender;
    }
    receive() external payable{
        require(msg.value >= 1, "Minimun 1 ETH required");
        participants.push(payable(msg.sender));
    }
    function getBalance() public view returns(uint){
        require(msg.sender== manager, "Only Manager can see Balance");
        return address(this).balance;
    }

    function random() public view returns(uint){
        // return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender)))% participants.length ;
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, participants.length)));

    }

    function selectWinner() public{
        require(msg.sender==manager);
        require(participants.length>=3);
        address payable winner;
        uint i = random()%participants.length;
        winner = participants[i];
        winner.transfer(getBalance());
        participants = new address payable [](0);

    }


}