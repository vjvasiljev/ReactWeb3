import { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";

const SCROLLID = "0x82750";
const SCROLL_SCAN_API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState();
  const [balance, setBalance] = useState();
  const [transactionCount, setTransactionCount] = useState();
  const [gas, setGas] = useState();

  const [isLoading, setIsLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [numTotalTransactions, setNumTotalTransactions] = useState(0);
  const [numSuccesfulTransactions, setNumSuccesfulTransactions] = useState(0);
  const [ethPrice, setEthPrice] = useState({ BTC: null, USD: null, EUR: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uniqueDays, setUniqueDays] = useState(new Set());
  const [uniqueWeeks, setUniqueWeeks] = useState(new Set());
  const [uniqueMonths, setUniqueMonths] = useState(new Set());
  const [totalUniqueDays, setTotalUniqueDays] = useState();
  const [totalUniqueWeeks, setTotalUniqueWeeks] = useState();
  const [totalUniqueMonths, setTotalUniqueMonths] = useState();

  // Define a state variable to track if a request is currently being processed
  const [isRequestingAccounts, setIsRequestingAccounts] = useState(false);

  //getting the balance from scroll api
  const getEtherBalance = async () => {
    // Make sure there is an account address to check. Without an address, the API call won't work.
    if (!account) {
      console.log("No account address to check balance for.");
      setIsLoading(false);
      return;
    }
    const apiBaseUrl = "https://api.scrollscan.com/api";
    const apiKeyToken = SCROLL_SCAN_API_KEY; // Replace with your actual API key token
    const url = `${apiBaseUrl}?module=account&action=balance&address=${account}&tag=latest&apikey=${apiKeyToken}`;

    // Ensure loading is true
    setIsLoading(true);

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check if the data contains an error message, in which case you should not proceed
      if (!data.result || data.result.startsWith("Error!")) {
        console.error("Error fetching balance:", data.result);
      } else {
        const web3 = new Web3(window.ethereum);
        // Convert from Wei to Ether and set the balance state
        setBalance(Number(web3.utils.fromWei(data.result, "ether")).toFixed(6));
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  //Get transaction list
  const getTransactionsByAddress = async (
    adress,
    startBlock = 0,
    endBlock = 99999999,
    page = 1,
    offset = 9999,
    sort = "asc"
  ) => {
    if (!adress) {
      console.log("No account address provided.");
      return;
    }

    const apiBaseUrl = "https://api.scrollscan.com/api";
    const apiKeyToken = SCROLL_SCAN_API_KEY; // Replace with your actual API key token
    // Construct the API endpoint with the given query parameters
    const url = `${apiBaseUrl}?module=account&action=txlist&address=${adress}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKeyToken}`;

    try {
      setIsLoading(true); // Start loading

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "1") {
        console.error("Error fetching transactions:", data.message);
        return [];
      }

      // Handle the transactions data
      console.log(data.result);
      // You can set the transactions data to a state or return it depending on your app's design
      setTransactions(data.result);
      setNumTotalTransactions(data.result.length);

      // Function to calculate the number of successful transactions
      const calculateSuccessfulTransactions = (transactions) => {
        return transactions.filter((tx) => tx.isError === "0").length;
      };

      // Number of successful transactions
      const numOfSuccessfulTransactions = calculateSuccessfulTransactions(
        data.result
      );
      setNumSuccesfulTransactions(numOfSuccessfulTransactions);

      // Helper function to format a date to YYYY-MM-DD
      const formatDate = (date) => {
        return date.toISOString().split("T")[0];
      };

      // Helper function to get the week number in the year
      const getWeekNumber = (date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      };

      // Helper function to format a date to its year-week representation "YYYY-WW"
      const formatWeek = (date) => {
        return `${date.getFullYear()}-W${getWeekNumber(date)
          .toString()
          .padStart(2, "0")}`;
      };

      // Helper function to calculate unique days, weeks, and months
      const calculateUniquePeriods = (transactions) => {
        // Assuming you have transactions in your state or props
        let tempUniqueDays = new Set(uniqueDays);
        let tempUniqueWeeks = new Set(uniqueWeeks);
        let tempUniqueMonths = new Set(uniqueMonths);

        transactions.forEach((tx) => {
          const date = new Date(tx.timeStamp * 1000);
          tempUniqueDays.add(formatDate(date)); // Add to temporary unique days
          tempUniqueWeeks.add(formatWeek(date)); // Add to temporary unique weeks
          tempUniqueMonths.add(`${date.getFullYear()}-${date.getMonth() + 1}`); // Add to temporary unique months
        });

        // Update the state with the new Sets
        setUniqueDays(tempUniqueDays);
        setUniqueWeeks(tempUniqueWeeks);
        setUniqueMonths(tempUniqueMonths);
        setTotalUniqueDays(tempUniqueDays.size);
        setTotalUniqueWeeks(tempUniqueWeeks.size);
        setTotalUniqueMonths(tempUniqueMonths.size);
      };

      // Get the totals
      calculateUniquePeriods(data.result);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  async function connectMetamask() {
    // If we are currently requesting accounts, don't start another request
    if (isRequestingAccounts) {
      return;
    }

    // Indicate that we are starting a request
    setIsRequestingAccounts(true);

    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
        // const currentChainID = await web3.eth.getChainId().then(console.log);
        // console.log(currentChainID);
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        setNetwork(chainId.toString());

        const accountsChangedHandler = async (accounts) => {
          console.log("Account changed: ", accounts[0]);

          if (accounts.length === 0) {
            console.log("Please connect to MetaMask.");
            // Optionally, prompt user to connect to MetaMask:
            // await window.ethereum.request({ method: 'eth_requestAccounts' });
          } else {
            const newAccount = accounts[0];
            setAccount(newAccount);
          }
        };

        window.ethereum.on("accountsChanged", accountsChangedHandler);

        const chainChangedHandler = (chainId) => {
          window.location.reload();
          console.log("Chain changed :", chainId);
          setNetwork(chainId);
        };

        window.ethereum.on("chainChanged", chainChangedHandler);
      } catch (error) {
        // Handle errors properly
        console.error("Error connecting to MetaMask:", error);
      } finally {
        // Indicate that the request has finished
        setIsRequestingAccounts(false);
      }
    } else {
      alert("Please download MetaMask");
      setIsRequestingAccounts(false);
    }
  }

  // async function connectMetamask() {
  //   if (window.ethereum) {
  //     const web3 = new Web3(window.ethereum);
  //     const accounts = await window.ethereum.request({
  //       method: "eth_requestAccounts",
  //     });
  //     // const accounts = await web3.eth.getAccounts();
  //     setAccount(accounts[0]);

  //     // const currentChainID = await web3.eth.getChainId().then(console.log);
  //     // console.log(currentChainID);
  //     const chainId = await window.ethereum.request({ method: "eth_chainId" });
  //     setNetwork(chainId.toString());

  //     const accountsChangedHandler = async (accounts) => {
  //       console.log("Account changed: ", accounts[0]);

  //       if (accounts.length === 0) {
  //         console.log("Please connect to MetaMask.");
  //         // Optionally, prompt user to connect to MetaMask:
  //         // await window.ethereum.request({ method: 'eth_requestAccounts' });
  //       } else {
  //         const newAccount = accounts[0];
  //         setAccount(newAccount);
  //       }
  //     };

  //     window.ethereum.on("accountsChanged", accountsChangedHandler);

  //     const chainChangedHandler = (chainId) => {
  //       window.location.reload();
  //       console.log("Chain changed :", chainId);
  //       setNetwork(chainId);
  //     };

  //     window.ethereum.on("chainChanged", chainChangedHandler);
  //   } else {
  //     alert("Please download Metamask");
  //   }
  // }

  async function switchNetwork() {
    const web3 = new Web3(window.ethereum);
    if (window.ethereum) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: SCROLLID,
          },
        ],
      });
      web3.setProvider("https://scroll.blockpi.network/v1/rpc/public");
      // const currentChainID = ;
      setNetwork(await (await web3.eth.getChainId()).toString());
    }
  }
  useEffect(() => {
    if (window.ethereum) {
      connectMetamask();
    }
  }, []);
  useEffect(() => {
    if (network) {
      if (network != SCROLLID) {
        switchNetwork();
      }
    }
  }, [network]);

  useEffect(() => {
    if (window.ethereum && account) {
      getEtherBalance();
      getTransactionsByAddress(account);
    }
  }, [account]); // Call this effect when `account` changes.
  useEffect(() => {
    //public RPC endpoint
    if (account) {
      console.log("Account: ", account);
      const web3 = new Web3(window.ethereum);
      function fromWeiToEth(wei) {
        return web3.utils.fromWei(wei, "ether");
      }

      async function getData() {
        getEtherBalance();
        // const balanceWei = await web3.eth.getBalance(
        //   "0x4F5197CD2BAdF78Cd5C63d7a1E0D8E7F0eD7e906"
        // );
        // setBalance(fromWeiToEth(balanceWei));

        // get the chain id of the current provider
        const chainID = await web3.eth.getChainId();
        setNetwork(chainID.toString());

        // get the nonce of an address
        try {
          // ... your existing calls
          const transactionCount = await web3.eth.getTransactionCount(
            "0x4F5197CD2BAdF78Cd5C63d7a1E0D8E7F0eD7e906"
          );
          setTransactionCount(transactionCount.toString());
        } catch (error) {
          console.error("Error getting data: ", error);
        }

        // get the current gas price
        const currentGasWei = await web3.eth.getGasPrice();

        setGas(fromWeiToEth(currentGasWei.toString()));
      }
      getData();
    }
  }, [account]);
  useEffect(() => {
    const getEthPrice = async () => {
      // Construct the API endpoint URL with query parameters
      const url = new URL("https://min-api.cryptocompare.com/data/price");
      url.search = new URLSearchParams({
        fsym: "ETH",
        tsyms: "BTC,USD,EUR",
      }).toString();

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        // Raises an error if the HTTP request returned an unsuccessful status code
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEthPrice({
          BTC: data.BTC,
          USD: data.USD,
          EUR: data.EUR,
        });
      } catch (e) {
        setError(`An error occurred: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    getEthPrice();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        Scroll Airdrop Checker
        <>
          <button onClick={connectMetamask} disabled={isRequestingAccounts}>
            {isRequestingAccounts
              ? "Waiting for MetaMask..."
              : "Connect to MetaMask"}
          </button>
          ;<button onClick={() => switchNetwork()}>Change to Scroll</button>
          <button onClick={() => getEtherBalance()}>Check balance</button>
          <button onClick={() => getTransactionsByAddress(account)}>
            Total transactions
          </button>
        </>
        <p>Your Account: {account ? account : "Loading..."} </p>
        <p> Network ID: {network ? network : "Loading..."}</p>
        <div>
          {loading && <p>Loading ETH prices...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && (
            <div>
              <p>ETH Price in EUR: {ethPrice.EUR}</p>
            </div>
          )}
        </div>
        <ul>
          Balance:
          <li>
            {balance ? `${Number(balance).toFixed(6)} ETH ` : "Loading..."}
          </li>
          <li>
            {balance
              ? `${Number(balance * ethPrice.EUR).toFixed(2)} USD `
              : "Loading..."}
          </li>
        </ul>
        <p>
          Total transactions:{" "}
          {transactionCount !== undefined ? transactionCount : "Loading..."}
        </p>
        <p>Current Gas: {gas ? gas : "Loading..."}</p>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : (
          <>
            <p>Total transactions: {numTotalTransactions}</p>
            {/* Render transactions list here */}
          </>
        )}
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : (
          <>
            <p>Succesful transactions: {numSuccesfulTransactions}</p>
            {/* Render transactions list here */}
          </>
        )}
        <ul>
          Total unique:
          <li>{totalUniqueDays ? `${totalUniqueDays} Days` : "Loading..."}</li>
          <li>
            {totalUniqueWeeks ? `${totalUniqueWeeks} Weeks` : "Loading..."}
          </li>
          <li>
            {totalUniqueMonths ? `${totalUniqueMonths} Month` : "Loading..."}
          </li>
        </ul>
      </header>
    </div>
  );
}

export default App;
