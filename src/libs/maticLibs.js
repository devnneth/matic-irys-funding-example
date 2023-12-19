const Web3 = require("web3").default;
const { ethers, Wallet, utils } = require("ethers");
const { sleep } = require("./util");
const CONF = require("../config");

const provider = new ethers.JsonRpcProvider(CONF.POLYGON_RPC);
provider.toBI = (v) => ethers.toBigInt(v);

// create mumbai account
const createOrGetMaticAccount = (privateKey) => {
    if (privateKey === "" || !privateKey) {
        return Wallet.createRandom(provider);
    } else {
        return getAccount(privateKey, provider);
    }
};

// get web3 account
const getAccount = (privateKey) => {
    return new Wallet(privateKey, provider);
};

// get current balance
const getBalance = async (account) => {
    return await provider.getBalance(account.address);
};

// funding
const funding = async (fromAccount, toAccount, weiAmount) => {
    try {
        const { gasLimit, maxPriorityFeePerGas, maxFeePerGas } = await getTransactionFee();

        let txObject = {
            to: toAccount.address,
            value: weiAmount.toString(),
            maxPriorityFeePerGas,
            maxFeePerGas,
            gasLimit,
            chainId: CONF.POLYGON_CHAINID,
            type: 2,
            nonce: await fromAccount.getNonce(),
        };
    
        const beforeBalance = await getBalance(fromAccount);
        const txResult = await fromAccount.sendTransaction(txObject);
    
        // Check transfer completed.
        for (let i = 0; i < 180; i++) {
            const currentBalance = await getBalance(fromAccount);
            if (currentBalance < beforeBalance) {
                return { txObject, txResult };
            }
            console.log("Funding...");
            await sleep(1000);
        }
    
        throw new Error("Network is busy.");  
    } catch (error) {
        console.error("Error during funding:", error);
        throw error;  
    }
};

// Transaction fee
const getTransactionFee = async () => {
    try {
        const { maxPriorityFeePerGas, maxFeePerGas, gasPrice } = await provider.getFeeData();
        const gasLimit = provider.toBI(21000);
        const fee = gasLimit * maxFeePerGas;
        return { gasLimit, fee, maxPriorityFeePerGas, maxFeePerGas, gasPrice };
    } catch (error) {
        console.error("Error getting transaction fee:", error);
        throw error;
    }
};

// move all balance
const withdrawAll = async (fromAccount, toAccount) => {
    try {
        const { gasLimit, fee, maxPriorityFeePerGas, maxFeePerGas } = await getTransactionFee();
    
        const amount = await getBalance(fromAccount);
        const weiAmount = amount - fee;
    
        // Checking
        if (weiAmount <= 0) {
            console.log("Not enough balance to transfer");
            return false;
        }
    
        let txObject = {
            to: toAccount.address,
            value: weiAmount.toString(),
            maxPriorityFeePerGas,
            maxFeePerGas,
            gasLimit,
            chainId: CONF.POLYGON_CHAINID,
            type: 2,
            nonce: await fromAccount.getNonce(),
        };
    
        const fromBalance = await getBalance(fromAccount);
        const txResult = await fromAccount.sendTransaction(txObject);
    
        // Check transfer completed.
        for (let i = 0; i < 120; i++) {
            const currentBalance = await getBalance(fromAccount);
            if (currentBalance < fromBalance) {
                return { txObject, txResult };
            }
            console.log("Withdrawing...");
            await sleep(1000);
        }
    
        throw new Error("Network is busy.");  
    } catch (error) {
        console.error("Error during withdrawal:", error);
        throw error;
    }
};

const parseRawTx = async (data) => {
    return utils.parseTransaction({ data })
}

module.exports = {
    getTransactionFee,
    createOrGetMaticAccount,
    getBalance,
    withdrawAll,
    funding,
    getAccount,
    parseRawTx,
    provider
};
