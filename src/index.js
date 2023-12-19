const Matic = require("./libs/maticLibs");
const Irys = require("./libs/irysLibs");
const CONF = require("./config");
const { pad } = require("./libs/util");

/**
 * Title:
 *   This program is a proof of concept for funding Matic to Irys. 
 * 
 * For your information:
 *   There may be some errors; if you intend to use this code in production, modifications are necessary.
 * 
 * Logic Description:
 *   1. Create or set up a test account.
 *   2. Fund test funds to the test account from the funding account set in config.js.
 *   3. Fund all Matic in the test account with Irys.
 *   4. Import all assets funded in Irys back into Matic.
 *   5. Send all Matic from your test account back to your funding account.
 */
const main = async () => {
    const FUNDING_AMOUNT = "1000000000000000"; // 0.001 ETH
    const TEST_ACCOUNT_PRIV = ""; // If you want to make a new account, empty it.

    // Checking configuration
    console.log(" > [1/6] Checking configuration.\n");

    if (CONF.MATIC_FUNDING_PRIVATEKEY === "") {
        console.log("Please configure [MATIC_FUNDING_PRIVATEKEY] in config.js.");
        return false;
    }

    // Preparing testing account
    console.log(" > [2/6] Preparing a test account.\n");

    const maticAccount = Matic.createOrGetMaticAccount(TEST_ACCOUNT_PRIV);
    console.log("---- Testing Account Info ---------------------------------");
    console.log(` Account  Public Key : ${maticAccount.address}`);
    console.log(` Account Private Key : ${maticAccount.privateKey}`);
    console.log("-----------------------------------------------------------");
    console.log("");

    // Funding Matic to the testing account
    console.log(" > [3/6] Funding Matics from the funding account to the test account.\n");

    const fundingAccount = Matic.getAccount(CONF.MATIC_FUNDING_PRIVATEKEY);
    await Matic.funding(fundingAccount, maticAccount, FUNDING_AMOUNT);
    await printBalances(maticAccount);

    // funding to Irys
    console.log(" > [4/6] Funding (Transfer) the test account from Matic to Irys.\n")

    await Irys.funding(maticAccount);
    await printBalances(maticAccount);

    // withdraw all
    console.log(" > [5/6] Withdrawing all funds of Irys to Matic.\n");

    await Irys.withdrawAll(maticAccount);
    await printBalances(maticAccount);

    // Get all matics from the new account to the funding account
    console.log(" > [6/6] Withdrawing all matics from the test account to the funder's account.\n");

    await Matic.withdrawAll(maticAccount, fundingAccount);
    await printBalances(maticAccount);

    console.log(" > Complete.\n");
};

// Printing testing account Balance
const printBalances = async (account) => {
    const maticBalance = await Matic.getBalance(account);
    const irysBalance = await Irys.getBalance(account);

    console.log("---- Testing Account Status -------------------------------");
    console.log(`Matic balance : ${pad(maticBalance, 18)}`);
    console.log(` Irys balance : ${pad(irysBalance, 18)}`);
    console.log("-----------------------------------------------------------");
    console.log("");
}

// MAIN
const runMain = async () => {
    try {
        await main();
    } catch (error) {
        console.log(error);
    }
};

runMain();
