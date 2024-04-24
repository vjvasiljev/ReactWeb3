import { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";

function App() {
  const [firstName, setFirstName] = useState("Viaceslav");
  const [account, setAccount] = useState();

  //when app first mount perform an action
  useEffect(() => {
    async function loadAccounts() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);

        try {
          // This will prompt MetaMask to connect and return the accounts
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Could not retrieve accounts", error);
        }
      } else {
        alert("MetaMask is not installed!");
        console.log("MetaMask is not installed!");
      }
    }

    loadAccounts();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        Decentrilized Ballot ({firstName})
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        ></input>
        <p>Your Account: {account} </p>
      </header>
    </div>
  );
}

export default App;
