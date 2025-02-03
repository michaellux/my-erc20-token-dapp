import { useState, useEffect } from "react";
import Web3 from "web3";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Move web3 initialization to top
const web3 = new Web3("http://127.0.0.1:8545");

// Supported networks (chain IDs)
const SUPPORTED_NETWORKS = {
  1: "Ethereum Mainnet",
  3: "Ropsten Testnet",
  4: "Rinkeby Testnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local Network",
  1337: "Ganache Local Network",
};

const checkSupportedNetwork = async () => {
  try {
    const chainId = await web3.eth.getChainId();
    const parsedChainId = parseInt(chainId.toString());
    const networkName = SUPPORTED_NETWORKS[parsedChainId] || `Unknown Network (ID: ${parsedChainId})`;

    if (!Object.keys(SUPPORTED_NETWORKS).includes(parsedChainId.toString())) {
      toast.error(`Unsupported Network: ${networkName}`);
      return false;
    }
    
    toast.success(`Connected to ${networkName}`);
    return true;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

const checkNetworkConnection = async () => {
  try {
    const web3Instance = new Web3("http://127.0.0.1:8545");
    await web3Instance.eth.net.isListening();
    return true;
  } catch (error) {
    console.error("Network connection failed:", error);
    return false;
  }
};

// Add after checkNetworkConnection
const checkContractPause = async () => {
  try {
    const contract = getContract();
    const isPaused = await contract.methods.paused().call();
    return !isPaused; // returns true if contract is active
  } catch (error) {
    console.error("Contract pause check failed:", error);
    return false;
  }
};

// Add wrapper function for pause check
const withPauseCheck = (operation) => async (...args) => {
  const isActive = await checkContractPause();
  if (!isActive) {
    toast.error("Contract is paused");
    return;
  }
  return operation(...args);
};

// Combine network and pause checks
const withChecks = (operation) => {
  return withNetworkCheck(withPauseCheck(operation));
};

const withNetworkCheck = (operation) => async (...args) => {
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    toast.error("No connection to blockchain network.");
    return;
  }

  const isSupported = await checkSupportedNetwork();
  if (!isSupported) {
    toast.error("Unsupported network detected. Switching to a supported network...");
    
    // Попытка автоматически переключиться на поддерживаемую сеть
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x1" }], // Пример: переключение на Ethereum Mainnet
        });
        toast.success("Switched to a supported network.");
      } catch (switchError) {
        toast.error("Failed to switch network. Please do it manually.");
      }
    }
    return;
  }

  return operation(...args);
};

const NetworkStatus = () => {
  const [networkId, setNetworkId] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      const chainId = await web3.eth.getChainId();
      const parsedChainId = parseInt(chainId.toString());
      setNetworkId(parsedChainId);
      setIsSupported(Object.keys(SUPPORTED_NETWORKS).includes(parsedChainId.toString()));
    };

    fetchNetwork();
  }, []);

  return (
    <div className="text-center my-4">
      <p className="text-sm sm:text-base md:text-lg">
        Current Network ID: <strong>{networkId || "Loading..."}</strong>
        {networkId && !isSupported && (
          <span className="text-red-500"> (Unsupported Network)</span>
        )}
      </p>
    </div>
  );
};

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Change this to your deployed contract address
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "initialSupply",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "TokenTransfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "burnFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
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
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const getContract = () => {
  return new web3.eth.Contract(contractABI, contractAddress);
};

function App() {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState("Неизвестная сеть");
  const [totalSupply, setTotalSupply] = useState(0);
  const [logs, setLogs] = useState([]);
  const [owner, setOwner] = useState(null);
  const [paused, setPaused] = useState(false);

  const [loading, setLoading] = useState(false); // Общее состояние

  const [isMinting, setIsMinting] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isTogglingPause, setIsTogglingPause] = useState(false);

  const Spinner = () => (
    <div className="border-t-transparent border-4 border-white border-solid rounded-full w-5 h-5 animate-spin"></div>
  );

  const GlobalLoadingOverlay = () => (
    loading && (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
        <Spinner />
      </div>
    )
  );  
  
  const [transactionHistory, setTransactionHistory] = useState([]);

  const fetchTransactionHistory = withNetworkCheck(async () => {
    try {
      const history = await getTransactionHistory();
      setTransactionHistory(history);
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      toast.error("Failed to fetch transaction history.");
    }
  });
  

  useEffect(() => {
    const connectToLocalhost = async () => {
      try {
        // Подключение к локальному узлу Hardhat
        const web3 = new Web3("http://127.0.0.1:8545");

        // Получение списка аккаунтов из локальной сети
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        // Получение chainId и преобразование в название сети
        const chainId = await web3.eth.getChainId();
        const networkName = getNetworkName(chainId);
        setNetwork(networkName);

        // Подключение контракта
        const contract = getContract();

        // Получение общего выпуска токенов
        const supply = await contract.methods.totalSupply().call();
        setTotalSupply(web3.utils.fromWei(supply, "ether"));
      } catch (error) {
        toast.error("Ошибка подключения к блокчейну: " + error.message);
        logAction("Ошибка подключения к блокчейну: " + error.message);
      }
    };

    connectToLocalhost();
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const balances = await getAllTokenBalances();
        if (balances && Array.isArray(balances)) {
          setLogs(balances.map(({ account, balance }) => 
            `${account}: ${balance} tokens`
          ));
        } else {
          setLogs(["No balances available"]);
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
        setLogs(["Error fetching balances"]);
      }
    };
  
    fetchBalances();
  }, []);

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet";
      case 3:
        return "Ropsten Testnet";
      case 4:
        return "Rinkeby Testnet";
      case 5:
        return "Goerli Testnet";
      case 11155111:
        return "Sepolia Testnet";
      case 31337:
        return "Hardhat Local Network";
      case 1337:
        return "Ganache Local Network";
      default:
        return `Неизвестная сеть (ID: ${chainId})`;
    }
  };

  const logAction = (message, duration = null) => {
    const timestamp = new Date().toLocaleString();
    const durationMessage = duration ? ` Duration: ${duration.toFixed(2)} ms.` : "";
    setLogs((prevLogs) => [`${timestamp}: ${message}${durationMessage}`, ...prevLogs]);
  };

  const handleTransaction = async (operation, setLoadingState, successMessage, errorMessage) => {
  const startTime = performance.now(); // Засекаем начало операции
  try {
    setLoadingState(true);
    await operation();
    const endTime = performance.now(); // Засекаем окончание операции
    logAction(successMessage, endTime - startTime); // Передаем длительность в лог
    toast.success(successMessage);
  } catch (error) {
    console.error(errorMessage, error);
    const endTime = performance.now();
    logAction(errorMessage + ": " + error.message, endTime - startTime); // Логируем ошибку с длительностью
    toast.error(errorMessage + ": " + error.message);
  } finally {
    setLoadingState(false);
  }
};

  const showSpinnerFor = async (operation, minTime = 500) => {
    const startTime = Date.now();
    setLoading(true);
  
    try {
      await operation();
    } catch (error) {
      console.error("Operation failed:", error);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = minTime - elapsedTime;
  
      if (remainingTime > 0) {
        setTimeout(() => setLoading(false), remainingTime);
      } else {
        setLoading(false);
      }
    }
  };

const mintTokens = withChecks((amount) =>
  showSpinnerFor(handleTransaction(
    async () => {
      const contract = getContract();
      await contract.methods
        .mint(account, web3.utils.toWei(amount, "ether"))
        .send({ from: account });

      const supply = await contract.methods.totalSupply().call();
      setTotalSupply(web3.utils.fromWei(supply, "ether"));
    },
    setIsMinting,
    `Successfully minted ${amount} tokens!`,
    "Error minting tokens"
  ))
);

const getBalance = withNetworkCheck(() => {
  return showSpinnerFor(() => 
    handleTransaction(
      async () => {
        const contract = getContract();
        const rawBalance = await contract.methods.balanceOf(account).call();
        const formattedBalance = web3.utils.fromWei(rawBalance, "ether");
        toast.success(`Your balance: ${formattedBalance} tokens`);
        return formattedBalance;
      },
      setIsCheckingBalance,
      (balance) => `Balance check complete.`,
      "Error getting balance"
    )
  );
});

const transferTokens = withChecks(async (recipient, amount) => {
  const contract = getContract();
  const amountInWei = web3.utils.toWei(amount, "ether");

  showSpinnerFor(
    handleTransaction(
      async () => {
        // Используем BN для работы с большими числами
        const BN = web3.utils.BN || require("bn.js");

        // Получение баланса отправителя
        const senderBalance = await contract.methods.balanceOf(account).call();
        const senderBalanceBN = new BN(senderBalance);
        const amountInWeiBN = new BN(amountInWei);

        // Проверяем, достаточно ли токенов
        if (senderBalanceBN.lt(amountInWeiBN)) {
          throw new Error("Insufficient token balance.");
        }

        // Выполняем перевод
        await contract.methods
          .transfer(recipient, amountInWei)
          .send({ from: account });

        // Обновляем историю транзакций
        fetchTransactionHistory();
      },
      setLoading,
      `Transferred ${amount} tokens to ${recipient}`,
      "Error transferring tokens:"
    )
  );
});

const transferOwnership = withNetworkCheck(async (newOwner) => {
  const contract = getContract();
  showSpinnerFor(handleTransaction(
    async () => {
      await contract.methods.transferOwnership(newOwner).send({ from: account });
      const updatedOwner = await contract.methods.owner().call();
      setOwner(updatedOwner);
    },
    setLoading,
    `Ownership transferred to ${newOwner}`,
    "Error transferring ownership."
  ))
});

// Special case for togglePause - should work even when paused
const togglePause = withNetworkCheck(async () => {
  const contract = getContract();
  showSpinnerFor(handleTransaction(
    async () => {
      if (paused) {
        await contract.methods.unpause().send({ from: account });
      } else {
        await contract.methods.pause().send({ from: account });
      }
      const updatedPausedStatus = await contract.methods.paused().call();
      setPaused(updatedPausedStatus);
    },
    setIsTogglingPause,
    (paused ? "Contract unpaused." : "Contract paused."),
    "Error toggling pause state."
  ))
});

const getAllTokenBalances = withNetworkCheck(async () => {
  const startTime = performance.now();
  try {
    const accounts = await web3.eth.getAccounts();
    const contract = getContract();

    if (!accounts || accounts.length === 0) {
      return [];
    }

    const balances = await Promise.all(
      accounts.map(async (account) => {
        const balance = await contract.methods.balanceOf(account).call();
        return {
          account,
          balance: web3.utils.fromWei(balance, "ether"),
        };
      })
    );
    const endTime = performance.now();
    logAction(`Token balances fetched`, endTime - startTime);
    return balances;
  } catch (error) {
    const endTime = performance.now();
    logAction(`Error fetching token balances: ${error}`, endTime - startTime);
    return [];
  }
});

const getTransactionHistory = withNetworkCheck(async () => {
  const contract = getContract();
  const events = await contract.getPastEvents("TokenTransfer", {
    fromBlock: 0,
    toBlock: "latest",
  });

  return events.map((event) => ({
    from: event.returnValues.from,
    to: event.returnValues.to,
    value: web3.utils.fromWei(event.returnValues.value, "ether"),
  }));
});

  const [filter, setFilter] = useState("all");
  const [filteredTransactionHistory, setFilteredTransactionHistory] = useState([]);

  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
    applyFilter(transactionHistory, selectedFilter);
  };

  const applyFilter = (transactions, selectedFilter) => {
    const accountLower = account?.toLowerCase();
    let filtered;
    switch (selectedFilter) {
      case "incoming":
        filtered = transactions.filter((tx) => tx.to.toLowerCase() === accountLower);
        break;
      case "outgoing":
        filtered = transactions.filter((tx) => tx.from.toLowerCase() === accountLower);
        break;
      default:
        filtered = transactions;
    }
    setFilteredTransactionHistory(filtered);
  };

  useEffect(() => {
    applyFilter(transactionHistory, filter);
  }, [transactionHistory, filter]);

  const shortenAddress = (address) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="mx-auto bg-white border border-gray-300 rounded-lg p-6 shadow-md">
      <GlobalLoadingOverlay />
      <ToastContainer />
      <header className="bg-green-500 text-white py-4 text-center">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">My DApp</h1>
        <NetworkStatus />
        <p className="text-sm sm:text-base md:text-lg">Connected account: {account || "Not connected"}</p>
        <p className="text-sm sm:text-base md:text-lg">Contract owner: {owner || "Not fetched"}</p>
        <p className="text-sm sm:text-base md:text-lg">Contract status: {paused ? "Paused" : "Active"}</p>
      </header>

      <main>
        <section className="mx-auto my-8 max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">Token Information</h2>
          <p className="text-sm sm:text-base md:text-lg">Total supply: {totalSupply}</p>
        </section>

        <section className="mx-auto my-8 max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">Manage Tokens</h2>
          <div className="flex flex-wrap gap-1">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const amount = e.target.mintAmount.value;
                if (amount <= 0) {
                  toast.error("Amount must be greater than 0");
                  return;
                }
                mintTokens(amount);
              }}
              className="w-full flex shrink-0 gap-2"
            >
              <input
                type="number"
                name="mintAmount"
                placeholder="Amount to mint"
                className="border border-gray-300 rounded py-2 px-4 w-full"
                required
                min="0"
                step="any"
              />
              <button
                type="submit"
                className="flex items-center justify-center bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
                disabled={isMinting}
              >
                {isMinting ? <Spinner /> : "Mint"}
              </button>
            </form>
            <button
              className="flex shrink-0 items-center justify-center w-full bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
              onClick={getBalance}
              disabled={isCheckingBalance} // Блокируем кнопку при загрузке
            >
              {isCheckingBalance ? <Spinner /> : "Сheck Balance"}
            </button>
          </div>
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              const recipient = e.target.recipient.value;
              const amount = e.target.amount.value;
              setLoading(true); // Установка глобального состояния загрузки
              transferTokens(recipient, amount).finally(() => setLoading(false));
            }}
          >
            <input
              className="border border-gray-300 rounded py-2 px-4 mt-2 mb-1 w-full"
              type="text"
              name="recipient"
              placeholder="Recipient Address"
              required
            />
            <input
              className="border border-gray-300 rounded py-2 px-4 mt-1 mb-2 w-full"
              type="number"
              name="amount"
              placeholder="Amount"
              required
            />
            <button
              className="w-full sm:w-auto bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
              type="submit"
              disabled={loading} // Блокировка кнопки при загрузке
            >
              {loading ? <Spinner /> : "Transfer Tokens"}
            </button>
          </form>
        </section>

        <section className="mx-auto my-8 max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">Administration</h2>
          <button
            className="w-full sm:w-auto bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
            onClick={togglePause}
            disabled={isTogglingPause}
          >
            {isTogglingPause ? <Spinner /> : paused ? "Unpause Contract" : "Pause Contract"}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const newOwner = e.target.newOwner.value;
              setLoading(true);
              transferOwnership(newOwner).finally(() => setLoading(false));
            }}
          >
            <input
              className="border border-gray-300 rounded py-2 px-4 mt-5 mb-2 w-full"
              type="text"
              name="newOwner"
              placeholder="New Owner Address"
              required
            />
            <button
              className="w-full sm:w-auto bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
              type="submit"
              disabled={loading}
            >
              {loading ? <Spinner /> : "Transfer Ownership"}
            </button>
          </form>
        </section>
        
        <section className="mx-auto my-8 max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">All Wallet Balances</h2>
          <button
            className="w-full sm:w-auto bg-green-500 hover:bg-green-700 focus:ring focus:ring-green-300 text-white font-bold py-2 px-4 rounded"
            onClick={async () => {
              const balances = await getAllTokenBalances();
              balances.forEach(({ account, balance }) => {
                toast.info(`${account}: ${balance} tokens`)
              });
            }}
          >
            Show All Balances
          </button>
        </section>

        <section className="mx-auto my-8 max-w-md bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">Action Logs</h2>
          <div className="max-h-64 overflow-y-auto">
            <ul className="list-none pl-0 text-sm text-gray-600 whitespace-normal break-words">
              {logs.map((log, index) => (
                <li key={index}>{log}</li>
              ))}
            </ul>
          </div>
        </section>
        <section className="bg-white border border-gray-300 rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-1">Transaction History</h2>
          <div className="flex justify-between items-center mb-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
              Filter Transactions:
            </label>
            <select
              id="filter"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </div>
          <button
            className="ml-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow"
            onClick={fetchTransactionHistory}
          >
            Refresh Transactions
          </button>
        </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full table-auto border-collapse border border-gray-300 text-sm text-gray-600">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">From</th>
                  <th className="border border-gray-300 px-4 py-2">To</th>
                  <th className="border border-gray-300 px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactionHistory.map((tx, index) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-100">
                    <td className="border border-gray-300 px-4 py-2 break-words">{shortenAddress(tx.from)}</td>
                    <td className="border border-gray-300 px-4 py-2 break-words">{shortenAddress(tx.to)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{tx.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="bg-gray-800 text-white py-4 text-center p-6">
          <h2 className="text-lg font-medium mb-1">How to Use This DApp</h2>
          <ol>
            <li>
              Make sure your local blockchain (e.g., Hardhat) is running on <strong>http://127.0.0.1:8545</strong>.
            </li>
            <li>
              Connect your wallet (e.g., Metamask) to the same network as the DApp.
            </li>
            <li>
              Use the available buttons to:
              <ul>
                <li>Mint tokens to your account.</li>
                <li>Check your token balance.</li>
                <li>Transfer tokens to another account by entering their address and the amount.</li>
                <li>Pause or unpause the contract (only for contract owner).</li>
              </ul>
            </li>
            <li>
              Ensure you are interacting with the correct contract address: <code className="text-[10px]">{contractAddress}</code>.
            </li>
          </ol>
          <p className="text-sm sm:text-base md:text-lg">
            If you encounter any issues, ensure your blockchain node is running and
            the contract is correctly deployed. Check the console for error messages.
          </p>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-4 text-center">
        <p className="text-sm sm:text-base md:text-lg">© 2025 My DApp</p>
      </footer>
    </div>
  );
}

export default App;
