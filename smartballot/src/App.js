import { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";

function App() {
  const [firstName, setFirstName] = useState("Viaceslav");
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState();
  const [balance, setBalance] = useState();

  useEffect(() => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);

      async function loadAccounts() {
        try {
          // Request account access if needed
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Could not retrieve accounts", error);
        }
      }

      loadAccounts();
    } else {
      alert("MetaMask is not installed!");
      console.log("MetaMask is not installed!");
    }
  }, []);

  useEffect(() => {
    async function loadBalance() {
      if (account) {
        const web3 = new Web3(window.ethereum);
        try {
          const chainId = await web3.eth.getChainId();
          const balanceWei = await web3.eth.getBalance(account);
          console.log("ChainID", chainId);
          setNetwork(chainId);
          setBalance(web3.utils.fromWei(balanceWei, "ether")); // Convert balance from Wei to Ether
        } catch (error) {
          console.error("Could not retrieve balance", error);
        }
      }
    }

    loadBalance();
  }, [account]); // This useEffect is dependent on `account` and will run when `account` changes

  return (
    <div className="App">
      <header className="App-header">
        Decentralized Ballot ({firstName})
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <p>Your Account: {account} </p>
        <p>
          Your Balance on Network ID ({network}):{" "}
          {balance ? `${balance} ETH` : "Loading..."}
        </p>
      </header>
    </div>
  );
}

export default App;
