import { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";

const SCROLLID = "0x82750";

function App() {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState();
  const [balance, setBalance] = useState();
  const [transactionCount, setTransactionCount] = useState();
  const [gas, setGas] = useState();

  async function connectMetamask() {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      // const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);

      // const currentChainID = await web3.eth.getChainId().then(console.log);
      // console.log(currentChainID);
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
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
    } else {
      alert("Please download Metamask");
    }
  }

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
    //public RPC endpoint
    if (account) {
      console.log("Account: ", account);
      const web3 = new Web3(window.ethereum);
      function fromWeiToEth(wei) {
        return web3.utils.fromWei(wei, "ether");
      }

      async function getData() {
        const balanceWei = await web3.eth.getBalance(
          "0x4F5197CD2BAdF78Cd5C63d7a1E0D8E7F0eD7e906"
        );
        setBalance(fromWeiToEth(balanceWei));

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

  return (
    <div className="App">
      <header className="App-header">
        Scroll Airdrop Checker
        <>
          <button onClick={() => connectMetamask()}>
            Connect to Metamask{" "}
          </button>
          <button onClick={() => switchNetwork()}>Change to Scroll</button>
        </>
        <p>Your Account: {account ? account : "Loading..."} </p>
        <p> Network ID: {network ? network : "Loading..."}</p>
        <p>Balance: {balance ? balance : "Loading..."}</p>
        <p>
          Total transactions:{" "}
          {transactionCount !== undefined ? transactionCount : "Loading..."}
        </p>
        <p>Current Gas: {gas ? gas : "Loading..."}</p>
      </header>
    </div>
  );
}

export default App;
