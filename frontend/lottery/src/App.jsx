import './App.css';
import { useState, useEffect } from 'react';
import Web3 from 'web3';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from './components/LoadingSpinner';

const CONTRACT_ADDRESS = "0x2e39e0764800ca1820a11d446946d7d1e123dbdb";
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "selectWinner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "manager",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "participants",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "random",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [balance, setBalance] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [entryAmount, setEntryAmount] = useState(0.01);
  const [transactionPending, setTransactionPending] = useState(false);

  // Detect Ethereum provider
  const getEthereumProvider = () => {
    if (typeof window.ethereum !== "undefined") {
      return window.ethereum; // Use the injected provider directly
    }

    // Alternative providers (Filecoin, Phantom, Coinbase, etc.)
    const providers = [
      window.filecoin,
      window.coinbaseWalletExtension,
      window.phantom,
      window.__CIPHER__,
    ].filter(Boolean); // Remove undefined values

    return providers.length > 0 ? providers[0] : null;
  };


  // Connect wallet function
  const connectWallet = async () => {
    setIsLoading(true);

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        toast.error("No Ethereum/Filecoin provider found. Please install a compatible wallet.");
        setIsLoading(false);
        return;
      }

      // Create a new Web3 instance
      let web3Instance;

      try {
        web3Instance = new Web3(provider);
      } catch (error) {
        console.error("Failed to create Web3 instance:", error);
        toast.error("Failed to initialize Web3. Please refresh and try again.");
        setIsLoading(false);
        return;
      }

      // Request accounts
      let accounts;
      try {
        // Different methods for different wallet providers
        if (provider.request) {
          accounts = await provider.request({ method: "eth_requestAccounts" });
        } else if (provider.enable) {
          accounts = await provider.enable();
        } else if (web3Instance.eth && web3Instance.eth.requestAccounts) {
          accounts = await web3Instance.eth.requestAccounts();
        } else {
          throw new Error("Cannot request accounts - provider method not found");
        }
      } catch (error) {
        console.error("Failed to get accounts:", error);
        toast.error("Failed to connect wallet. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!accounts || accounts.length === 0) {
        toast.error("No accounts found or access denied.");
        setIsLoading(false);
        return;
      }

      // Create contract instance
      try {
        const contractInstance = new web3Instance.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        setAccount(accounts[0]);
        setWeb3(web3Instance);
        setContract(contractInstance);

        toast.success("Wallet connected successfully!");
      } catch (error) {
        console.error("Contract initialization failed:", error);
        toast.error("Failed to initialize contract. Please check the network and try again.");
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      toast.error("Failed to connect wallet: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the current account is the manager
  const checkIfManager = async () => {
    if (contract && account) {
      try {
        const managerAddress = await contract.methods.manager().call();
        setIsManager(account.toLowerCase() === managerAddress.toLowerCase());
      } catch (error) {
        console.error("Error checking manager status:", error);
      }
    }
  };

  // Get contract balance
  const getContractBalance = async () => {
    if (contract && account) { // Ensure account is connected
      try {
        const managerAddress = await contract.methods.manager().call();

        if (account.toLowerCase() !== managerAddress.toLowerCase()) {
          toast.error("Only the manager can view the contract balance.");
          return;
        }

        const balanceWei = await contract.methods.getBalance().call({ from: account });
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        setBalance(balanceEth);
        console.log(balanceEth);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };


  // Get participants
  const getParticipants = async () => {
    if (contract) {
      try {
        let participantsList = [];
        let index = 0;
        let participantAddress;

        // Loop through participants until we get an error or empty address
        while (true) {
          try {
            participantAddress = await contract.methods.participants(index).call();
            if (participantAddress && participantAddress !== '0x0000000000000000000000000000000000000000') {
              participantsList.push(participantAddress);
            }
            index++;
          } catch (error) {
            break; // Break the loop if we've reached the end of the array
          }
        }

        setParticipants(participantsList);
        console.log(participantsList)
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    }
  };

  // Enter lottery
  const enterLottery = async () => {
    if (!contract || !account) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Ensure the entry amount is valid and at least 1 ETH
    if (!entryAmount || isNaN(entryAmount) || entryAmount < 1) {
      toast.error("You must send at least 1 ETH to enter the lottery");
      return;
    }

    setTransactionPending(true);

    try {
      const amountToSend = web3.utils.toWei(entryAmount.toString(), "ether");

      // Sending ETH to the contract
      await web3.eth.sendTransaction({
        from: account,
        to: CONTRACT_ADDRESS,
        value: amountToSend,
      });

      toast.success("Successfully entered the lottery!");

      // Refresh UI Data
      getContractBalance();
      getParticipants();
    } catch (error) {
      console.error("Error entering lottery:", error);

      // Improved Error Handling
      if (error.message.includes("insufficient funds")) {
        toast.error("Insufficient funds. Please add more ETH to your wallet.");
      } else if (error.message.includes("denied")) {
        toast.error("Transaction was denied by the user.");
      } else {
        toast.error("Failed to enter the lottery: " + (error.message || "Unknown error"));
      }
    } finally {
      setTransactionPending(false);
    }
  };


  // Select winner (only for manager)
  const selectWinner = async () => {
    if (!contract || !account || !isManager) {
      toast.error("Only the manager can select a winner");
      return;
    }

    if (participants.length < 3) {
      toast.warning("Need at least 3 participants before selecting a winner");
      return;
    }

    setTransactionPending(true);

    try {
      await contract.methods.selectWinner().send({
        from: account
      });

      toast.success("Winner has been selected and prize distributed!");
      getContractBalance();
      getParticipants();
    } catch (error) {
      console.error("Error selecting winner:", error);
      toast.error("Failed to select winner: " + (error.message || "Unknown error"));
    } finally {
      setTransactionPending(false);
    }
  };

  // Get random number (for debugging)
  const getRandomNumber = async () => {
    if (contract && isManager) {
      try {
        const randomNum = await contract.methods.random().call();
        toast.info(`Random number: ${randomNum}`);
      } catch (error) {
        console.error("Error getting random number:", error);
      }
    }
  };

  // Load data when contract and account are set
  useEffect(() => {
    if (contract && account) {
      checkIfManager();
      getContractBalance();
      getParticipants();
    }
  }, [contract, account]);

  // Listen for account changes
  useEffect(() => {
    const provider = getEthereumProvider();

    if (provider) {
      // Handle different provider event methods
      if (provider.on) {
        // Account changes
        provider.on("accountsChanged", (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            setAccount(null);
            setIsManager(false);
          }
        });

        // Network changes
        provider.on("chainChanged", () => {
          window.location.reload();
        });

        // Disconnect
        provider.on("disconnect", () => {
          setAccount(null);
          setIsManager(false);
        });
      }
    }

    return () => {
      if (provider && provider.removeListener) {
        provider.removeListener("accountsChanged", () => { });
        provider.removeListener("chainChanged", () => { });
        provider.removeListener("disconnect", () => { });
      }
    };
  }, []);

  return (
    <div className="app-container">
      <ToastContainer position="top-right" theme="dark" />
      {isLoading && <LoadingSpinner />}

      <div className="lottery-container">
        <div className="lottery-header">
          <h1 className="title">Crypto Lottery</h1>
          <p className="subtitle">Try your luck and win big!</p>
        </div>

        {!account ? (
          <div className="connect-wallet-container">
            <div className="wallet-card">
              <h2>Welcome to the Lottery!</h2>
              <p>Connect your wallet to participate</p>
              <button
                className="connect-button"
                onClick={connectWallet}
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          </div>
        ) : (
          <div className="lottery-content">
            <div className="wallet-info">
              <h3>Connected Wallet</h3>
              <p className="address">{`${account.slice(0, 6)}...${account.slice(-4)}`}</p>
              {isManager && <span className="manager-badge">Manager</span>}
            </div>

            <div className="lottery-stats">
              <div className="stat-card">
                <h3>Prize Pool</h3>
                <p className="stat-value">{balance} FIL</p>
              </div>

              <div className="stat-card">
                <h3>Participants</h3>
                <p className="stat-value">{participants.length}</p>
              </div>
            </div>

            {!isManager && (<div className="enter-lottery">
              <h3>Enter the Lottery</h3>
              <div className="input-group">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="Entry amount in FIL"
                  className="amount-input"
                />
                <button
                  className="enter-button"
                  onClick={enterLottery}
                  disabled={transactionPending}
                >
                  {transactionPending ? "Processing..." : "Enter Lottery"}
                </button>
              </div>
            </div>)}

            {isManager && (
              <div className="manager-actions">
                <h3>Manager Actions</h3>
                <button
                  className="select-winner-button"
                  onClick={selectWinner}
                  disabled={transactionPending || participants.length < 3}
                >
                  {transactionPending ? "Processing..." : "Select Winner"}
                </button>
                <button
                  className="debug-button"
                  onClick={getRandomNumber}
                >
                  Test Random Function
                </button>
              </div>
            )}

            <div className="participants-section">
              <h3>Current Participants</h3>
              {participants.length > 0 ? (
                <div className="participants-list">
                  {participants.map((participant, index) => (
                    <div key={index} className="participant-item">
                      <span className="participant-number">{index + 1}</span>
                      <span className="participant-address">
                        {`${participant.slice(0, 8)}...${participant.slice(-6)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-participants">No participants yet. Be the first to enter!</p>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</p>
        <p>Powered by Filecoin • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;