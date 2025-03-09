# 💰Lottery System - Smart Contract 📃

## Overview
This project implements a **Lottery System** using **Solidity** on the Ethereum blockchain. Participants can enter the lottery by sending **ETH** to the smart contract. The winner is randomly selected, and the prize pool is distributed accordingly.

## Features
- Secure and decentralized lottery system.
- Minimum **1 ETH** required to participate.
- Random selection of the winner.
- Only the **manager** can pick the winner.

## Smart Contract Details
### **Contract: Lottery.sol**
- `manager`: Stores the address of the contract owner.
- `participants`: Array storing all the lottery participants.
- `receive() external payable`: Allows users to enter the lottery by sending ETH (minimum 1 ETH required).
- `getBalance() public view`: Returns the total balance of the lottery contract.
- `pickWinner() public`: Selects a random winner and transfers the total prize to them. Only the manager can call this function.

## How to Use
### 1. Deploy the Smart Contract
- Use **Remix IDE** or any Ethereum development environment.
- Deploy the `Lottery.sol` contract.

### 2. Enter the Lottery
- Send at least **1 ETH** to the contract address.
- Your address will be added to the participant list.

### 3. Pick a Winner
- The **manager** calls `pickWinner()` to randomly select a participant.
- The winner receives the entire contract balance.
- The participant list is reset for the next round.

