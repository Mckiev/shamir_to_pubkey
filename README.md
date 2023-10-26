# "Multi-sig" File Encryption

If one wants to secure Ethereum-based assets, multi-sig smart contracts like Gnosis Safe solve this issue. However, if I wanted to secure other types of keys and information (e.g., Ledger seed phrase and instructions on where to look for assets), I couldn't find a way to do it.

I chose this toy project to learn the basics of web development. GPT-4 wrote most of the code, though.

This web application enables file encryption with a randomly generated password, splitting the password into shares using Shamir's Secret Sharing scheme, and encrypting each share, such that only the owner of the provided Eth-wallet would be able to recover each share.

<mark style="background: #FF5582A6;">**Disclaimer**</mark> 
Don't really use this repo - I have no idea about security practices and probably messed up multiple times in this repo.

Credits:

https://github.com/grempe/secrets.js

https://github.com/pubkey/eth-crypto

https://github.com/ethers-io/ethers.js

[GPT-4](https://chat.openai.com/)

## How to Use it
(don't)

The app is intended to be used offline on an air-gapped machine, such that sensitive data is never exposed to the internet.
Preparation, however, is done on an online machine - it's necessary to fetch Ethereum public keys of the addresses in question.

First, choose Ethereum addresses that will share access to the password that would be used to encrypt the data. Make sure the owner of the address has access to the seed or the private key. ***Don't use contract addresses.***

Go to https://pubkey-fetch.vercel.app/, obtain public keys, and save them to JSON.
Note: the Eth account must have made at least one transaction for the code to work.

![](https://i.imgur.com/Si0mv4i.png)


Download this JSON, and this whole repository, put it on a flash drive, and proceed on an air-gapped machine.

Open index.html

### **Generate & Split**

This tab provides main functionality - encrypting a file, splitting the password, and encrypting the shares.

1. Generate a random password.
2. Choose the total number of shares, and the number required to recover the password. Do the split.
3. Upload the JSON with public keys generated earlier.
4. Encrypt shares - each share gets encrypted to the respective recipient.
5. Download JSON with encrypted shares.
6. Encrypt the file with your precious data.

Note: you'll have to pass encrypted shares to the address owners, and your encrypted file together with decryption instructions. Choose any method you find convenient.

### **Encrypt**

This tab provides functionality to encrypt any text message to the public key owner, if you want to do so.

### **Decrypt**

This tab provides decryption functionality.

The recipient can use either the private key or the seed phrase that controls the account in question. 
The derivation path can be adjusted.

### **Combine**

This tab provides the functionality to combine shares into the original password and use it to decrypt the file.

Supposedly, each recipient will bring his own previously decrypted share, and together they can recover the encrypted file.

