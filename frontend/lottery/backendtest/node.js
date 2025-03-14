import Web3 from "web3";

const web3 = new Web3("https://api.calibration.node.glif.io/rpc/v1"); // Use your Filecoin RPC URL

async function checkContract() {
    const code = await web3.eth.getCode("0x2e39e0764800ca1820a11d446946d7d1e123dbdb");
    console.log("Contract Code:", code);
    // console.log(":",web3.eth.getTransactionReceipt("0x7b6aaf0c7decef4071312fe717e5db68df2b3367ce4ff60dc32d7aaba1dc51e0")
}

checkContract();
