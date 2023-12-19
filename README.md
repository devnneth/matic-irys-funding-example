# Funding and withdrawing Matic to Irys

This program is a proof of concept for funding Matic to Irys. There may be some errors; if you intend to use this code in production, modifications are necessary.

> Related Discord chat : https://discord.com/channels/864852288002850866/994913536906109029/1182621622197301268

## Test environment
- Windows 11
- JavaScript
- Node.js v20.9.0

## Configuration
Open `src/config.js` and enter your account's private key `MATIC_FUNDING_PRIVATEKEY` variable to fund for the test.

## Installation and running
```bash
$ npm install
$ npm start
```

## Example
```cmd
C:\matic-irys-test>npm start

> matic-irys-funding-example@1.0.0 start
> node src/index.js

 > [1/6] Checking configuration.

 > [2/6] Preparing a test account.

---- Testing Account Info ---------------------------------
 Account  Public Key : 0x3EC57fDa36294823c5725C9c8CbC5Ecc04EEfD75
 Account Private Key : 
-----------------------------------------------------------

 > [3/6] Funding Matics from the funding account to the test account.

Funding...
Funding...
---- Testing Account Status -------------------------------
Matic balance :   1000000000000000
 Irys balance :                  0
-----------------------------------------------------------

 > [4/6] Funding (Transfer) the test account from Matic to Irys.

---- Transaction fee calculation --------------------------
        maxFeePerGas :        15000000160
maxPriorityFeePerGas :        15000000160
            gasLimit :              21000
     mfpg * gasLimit :    315000003360000
       matic balance :   1000000000000000
      funding amount :    684999996640000
                 fee :    315000003360000
funding amount + fee :   1000000000000000
-----------------------------------------------------------

---- Testing Account Status -------------------------------
Matic balance :                  0
 Irys balance :    684999996640000
-----------------------------------------------------------

 > [5/6] Withdrawing all funds of Irys to Matic.

withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
withdrawing...
---- Testing Account Status -------------------------------
Matic balance :    653499996304000
 Irys balance :                  0
-----------------------------------------------------------

 > [6/6] Withdrawing all matics from the test account to the funder's account.

Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
Withdrawing...
---- Testing Account Status -------------------------------
Matic balance :                  0
 Irys balance :                  0
-----------------------------------------------------------

 > Complete.
```