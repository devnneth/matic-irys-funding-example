const Irys = require("@irys/sdk");
const CONF = require("../config");
const Matic = require("./maticLibs");
const { sleep, pad } = require("./util");

const __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };

const bignumber_1 = require("@ethersproject/bignumber");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const wallet_1 = require("@ethersproject/wallet");
const providers_1 = require("@ethersproject/providers");

let instance = {};

// get irys sdk instance
const getIrys = (account) => {
    if (instance[account.address]) return instance[account.address];

    instance[account.address] = new Irys({
        url: CONF.IRYS_URL,
        token: "matic",
        key: account.privateKey,
        config: { providerUrl: CONF.POLYGON_RPC },
    });

    return instance[account.address];
};

// get current balance
const getBalance = async (maticAmount) => {
    const irys = getIrys(maticAmount);
    return await irys.getLoadedBalance();
};

/**
 * Getting Irys's transaction fee settings
 * 
 *      ref location1 : @irys/sdk/build/cjs/node/tokens/ethereum.js:L11, L92
 *      ref location2 : @irys/sdk/build/cjs/common/fund.js:L35
 * 
 * @param {*} maticAccount 
 * @returns object
 */
const getTransactionFee = async (maticAccount, isWithdraw = false) => {
    const to = maticAccount.address;
    const _amount = await Matic.getBalance(maticAccount);

    // Gas price
    const provider = new providers_1.JsonRpcProvider(CONF.POLYGON_RPC);
    const wallet = new wallet_1.Wallet(maticAccount, provider);
    let gasPrice = await provider.getGasPrice();
    gasPrice = bignumber_1.BigNumber.from(
        new bignumber_js_1.default(gasPrice.toString())
            .multipliedBy(10)
            .decimalPlaces(0)
            .toString()
    );

    // Change legacy tx to EIP-1559 tx.
    const tx = await wallet.populateTransaction({
        to,
        value: _amount,
        from: this.address,
        gasPrice,
        gasLimit: 21000,
    });

    // Extraction EIP-1559 fee settings.
    const toBI = (v) => Matic.provider.toBI(v.toString());
    const maxFeePerGas = toBI(tx.maxFeePerGas);
    const maxPriorityFeePerGas = toBI(tx.maxPriorityFeePerGas);
    const gasLimit = toBI(tx.gasLimit);
    let fee = maxFeePerGas * gasLimit;

    if (isWithdraw) {
        fee = fee / toBI(10);  
    };

    return { fee, maxFeePerGas, maxPriorityFeePerGas, gasLimit };
};

// funding
const funding = async (fromAccount) => {
    const beforeBalance = await getBalance(fromAccount);
    const irys = getIrys(fromAccount);

    let fundTx = null;
    while (true) {
        try {
            const maticBalance = await Matic.getBalance(fromAccount);
            let feeData = await getTransactionFee(fromAccount);
            const fundingAmount = maticBalance - feeData.fee;

            console.log("---- Transaction fee calculation --------------------------");
            console.log("        maxFeePerGas : " + pad(feeData.maxFeePerGas, 18));
            console.log("maxPriorityFeePerGas : " + pad(feeData.maxPriorityFeePerGas, 18));
            console.log("            gasLimit : " + pad(feeData.gasLimit, 18));
            console.log("     mfpg * gasLimit : " + pad(feeData.maxFeePerGas * feeData.gasLimit, 18));
            console.log("       matic balance : " + pad(maticBalance, 18));
            console.log("      funding amount : " + pad(fundingAmount, 18));
            console.log("                 fee : " + pad(feeData.fee, 18));
            console.log("funding amount + fee : " + pad(fundingAmount + feeData.fee, 18));
            console.log("-----------------------------------------------------------");
            console.log("");
        
            if (fundingAmount <= 0) {
                console.log("There is no matics.\n");
                return;
            }

            fundTx = await irys.fund(fundingAmount.toString());
            break;
        } catch (error) {
            console.log(error)
            console.log("Transaction fee changed. Retring...")
        }
    }

    // 잔고 갱신 확인
    for (let i = 0; i < 120; i++) {
        const currBalance = await getBalance(fromAccount);
        if (currBalance.gt(beforeBalance)) {
            return fundTx;
        }
        console.log("Funding...");
        await sleep(1000);
    }

    return false;
};

// Withdraw all
const withdrawAll = async (maticAccount) => {
    const irys = getIrys(maticAccount);

    // Transaction fee
    const feeData = await getTransactionFee(maticAccount, true);
    const balance = (await getBalance(maticAccount)).toString();
    
    // Empty check
    if (balance === "0") return true;

    const toBI = Matic.provider.toBI;
    const amount = toBI(balance.toString()) - feeData.fee;

    // Empty check after subtract the fee from amount.
    if (amount <= 0) {
        console.log("Current balnace under the transaction fee.");
        console.log("Transaction fee: " + feeData.fee.toString());
        console.log("Balance: " + balance.toString()) + "\n";
        return false;
    }
    
    // withdraw
    const fundTx = await irys.withdrawBalance(amount);

    // 잔고 갱신 확인
    for (let i = 0; i < 120; i++) {
        const currBalance = await getBalance(maticAccount);
        if (currBalance.lt(balance)) {
            if (currBalance.gt(toBI(0))) {
                console.log("Withdraw again (tx fee gap)\n");
                return withdrawAll(maticAccount);
            } else {
                return fundTx;
            }
        }
        console.log("withdrawing...");
        await sleep(3000);
    }

    return false;
};


module.exports = {
    funding,
    getBalance,
    withdrawAll,
    getTransactionFee,
};
