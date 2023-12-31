const secrets = require('secrets.js-grempe');
const EthCrypto = require('eth-crypto');
const { ethers } = require('ethers');

// JavaScript for tab switching
window.openTab = function(tabName) {
    let i, tabContent;
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}

// Converts public key to the format expected by EthCrypto
const hexToUint8Array = (hexString) => {
    // Remove '0x' prefix if present
    if (hexString.startsWith('0x')) {
        hexString = '04' + hexString.slice(2);
    }
    // Ensure even number of characters
    if (hexString.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }
    var bytes = new Uint8Array(hexString.length / 2);
    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Function to initiate automatic file download
function initDownoad(theData, fileName) {
    // Create Blob and initiate automatic file download
    const blob = new Blob([theData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;  // Set the file name
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Function to display public keys when JSON file is uploaded
function displayPublicKeys(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        try {
            const data = JSON.parse(content);
            const encryptedSharesTable = document.getElementById('encryptedShares');
            data.pairs.forEach((pair) => {
                const row = document.createElement('tr');

                const indexCell = document.createElement('td');
                const ethAddressCell = document.createElement('td');
                const publicKeyCell = document.createElement('td');
                const originalShareCell = document.createElement('td');
                const encryptedShareCell = document.createElement('td');
                const originalShareTextarea = document.createElement('textarea');
                const encryptedShareTextarea = document.createElement('textarea');

                indexCell.textContent = encryptedSharesTable.rows.length;  // Assumes header row is present
                ethAddressCell.textContent = pair.ethAddress;
                publicKeyCell.textContent = pair.publicKey;
                originalShareTextarea.readOnly = true;
                encryptedShareTextarea.readOnly = true;

                originalShareCell.appendChild(originalShareTextarea);
                encryptedShareCell.appendChild(encryptedShareTextarea);

                row.appendChild(indexCell);
                row.appendChild(ethAddressCell);
                row.appendChild(publicKeyCell);
                row.appendChild(originalShareCell);
                row.appendChild(encryptedShareCell);

                encryptedSharesTable.appendChild(row);
            });
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    };
    reader.readAsText(file);
}


document.addEventListener("DOMContentLoaded", function () {
    // Open the first tab by default
    openTab('generateTab');
    
    const generatePasswordButton = document.getElementById("generatePassword");
    const passwordInputElement = document.getElementById("passwordInput");
    const splitSecretButton = document.getElementById("splitSecret");
    const sharesElement = document.getElementById("shares");

    // Function to split the generated password using Shamir Secret Sharing
    function splitPassword() {
        const password = passwordInputElement.value;
        if (!password) {
            alert("Please enter or generate a password first.");
            return;
        }

        const numberOfShares = parseInt(document.getElementById("totalShares").value) || 5;
        const minimumSharesRequired = parseInt(document.getElementById("minShares").value) || 3;

        if (minimumSharesRequired > numberOfShares) {
            alert("The number of shares for recovery cannot be greater than the total number of shares.");
            return;
        }

        const shares = secrets.share(password, numberOfShares, minimumSharesRequired);

        // Clear previous shares
        while (sharesElement.firstChild) {
            sharesElement.removeChild(sharesElement.firstChild);
        }

    // Display each share in a separate row
    shares.forEach((share, index) => {
        const row = document.createElement("tr");
        const labelCell = document.createElement("td");
        const textareaCell = document.createElement("td");
        const textarea = document.createElement("textarea");

        labelCell.innerHTML = `<strong>Share #${index + 1}</strong>`;
        textarea.textContent = share;
        textarea.readOnly = true;

        textareaCell.appendChild(textarea);
        row.appendChild(labelCell);
        row.appendChild(textareaCell);

        sharesElement.appendChild(row);
    });
    }

    generatePasswordButton.addEventListener("click", () => {
        const generatedPassword = secrets.random(256); // Using secrets.random
        passwordInputElement.value = generatedPassword; // Fill the input field with the generated password
    });

    async function encryptShare(share, publicKey) {
        const publicKeyUint8Array = hexToUint8Array(publicKey)
        const encryptedShare = await EthCrypto.encryptWithPublicKey(
            publicKeyUint8Array, // by encryping with the receiver's publicKey, only the receiver can decrypt the payload with his privateKey
            share // String or Uint8Array
        );
        
        return EthCrypto.cipher.stringify(encryptedShare);
    }

    document.getElementById('publicKeyFile').addEventListener('change', displayPublicKeys);

    // Code to split the password
    splitSecretButton.addEventListener("click", splitPassword);

    const encryptSharesButton = document.getElementById('encryptSharesButton');
    
    async function encryptShares() {
        const sharesTable = document.getElementById('shares');
        const sharesRows = sharesTable.rows;
        const encryptedSharesTable = document.getElementById('encryptedShares');
        const encryptedSharesRows = encryptedSharesTable.rows;
    
        for (let i = 0; i < sharesRows.length && i < encryptedSharesRows.length - 1; i++) {  
            const shareRow = sharesRows[i];
            const encryptedShareRow = encryptedSharesRows[i+1]; // Skip header row (i=0)
            const originalShareTextarea = encryptedShareRow.cells[3].querySelector('textarea');
            const encryptedShareTextarea = encryptedShareRow.cells[4].querySelector('textarea');
            const publicKeyCell = encryptedShareRow.cells[2];
    
            if (originalShareTextarea && encryptedShareTextarea && publicKeyCell) {
                const originalShare = shareRow.cells[1].querySelector('textarea').value;  // Fetch original share value from shares table
                originalShareTextarea.value = originalShare;  // Set the original share value
    
                const publicKey = publicKeyCell.textContent;
                try {
                    const encryptedShare = await encryptShare(originalShare, publicKey);
                    encryptedShareTextarea.value = encryptedShare;
                } catch (error) {
                    console.error('Error encrypting share:', error);
                    alert('Error encrypting share:' + error.message);
                }
            }
        }
    }
    
    encryptSharesButton.addEventListener('click', encryptShares);

    // Code to save encrypted shares as JSON
    document.getElementById('generateJsonButton').addEventListener('click', generateJson);

    function generateJson() {
        const table = document.getElementById('encryptedShares');
        const rows = table.rows;
        const jsonData = [];

        for (let i = 1; i < rows.length; i++) {  // assuming row 0 is the header
            const cells = rows[i].cells;
            const ethAddress = cells[1].textContent;
            const encryptedShare = cells[4].querySelector('textarea').value;

            jsonData.push({ ethAddress, encryptedShare });
        }

        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'encrypted-shares.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

}

    // Code for combining shares to recover the password

    const combineButton = document.getElementById("combineButton");
    const recoveredPasswordElement = document.getElementById("recoveredPassword");

    function combineShares() {
        const sharesToCombine = [];
        for (let i = 1; i <= shareRowCount; i++) {
            const shareValue = document.getElementById(`shareInput${i}`).value;
            if (shareValue) {
                sharesToCombine.push(shareValue);
            }
        }

        const recoveredPassword = secrets.combine(sharesToCombine);
        recoveredPasswordElement.textContent = `${recoveredPassword}`;
    }
    
    const addShareRowButton = document.getElementById("addShareRow");
    const shareRowsElement = document.getElementById("shareRows");

    let shareRowCount = 0;

    function addShareRow() {
        shareRowCount++;
        const newTextArea = document.createElement("textarea");
        newTextArea.placeholder = `Enter share #${shareRowCount}`;
        newTextArea.id = `shareInput${shareRowCount}`;
        shareRowsElement.appendChild(newTextArea);
    }

    // Initially add 3 rows
    for (let i = 0; i < 3; i++) {
        addShareRow();
    }

    const removeShareRowButton = document.getElementById("removeShareRow");

    function removeShareRow() {
        if (shareRowCount > 0) {
            const lastTextArea = document.getElementById(`shareInput${shareRowCount}`);
            if (lastTextArea) {
                lastTextArea.remove();
                shareRowCount--;
            }
        }
    }

    removeShareRowButton.addEventListener("click", removeShareRow);
    addShareRowButton.addEventListener("click", addShareRow);
    combineButton.addEventListener("click", combineShares);

    const fileInputElement = document.getElementById("fileInput");
    const encryptFileButton = document.getElementById("encryptFile");
    const decryptFileButton = document.getElementById("decryptFile");
    const encryptionStatusElement = document.getElementById("encryptionStatus");

    function hexToArrayBuffer(hex) {
        const buffer = new ArrayBuffer(hex.length / 2);
        const dataView = new DataView(buffer);
        for (let i = 0; i < hex.length; i += 2) {
            dataView.setUint8(i / 2, parseInt(hex.substring(i, i + 2), 16));
        }
        return buffer;
    }

    async function encryptFile() {
        try {
            const file = fileInputElement.files[0];
            if (!file) {
                encryptionStatusElement.textContent = 'No file selected';
                return;
            }

            const password = document.getElementById("passwordInput").value;
            if (!password) {
                encryptionStatusElement.textContent = 'Please generate or enter a password first';
                return;
            }

            const keyBuffer = hexToArrayBuffer(password);
            const key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
            
            const fileBuffer = await file.arrayBuffer();
            const fileName = file.name;
            const metadata = JSON.stringify({ fileName });
            const metadataBuffer = new TextEncoder().encode(metadata);
            const delimiter = new TextEncoder().encode("||");
        
            const combinedArray = new Uint8Array(
                metadataBuffer.length + delimiter.length + fileBuffer.byteLength
            );
            combinedArray.set(metadataBuffer, 0);
            combinedArray.set(delimiter, metadataBuffer.length);
            combinedArray.set(new Uint8Array(fileBuffer), metadataBuffer.length + delimiter.length);
        
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                combinedArray
            );
        
            const finalArray = new Uint8Array(iv.length + encryptedData.byteLength);
            finalArray.set(iv, 0);
            finalArray.set(new Uint8Array(encryptedData), iv.length);
            
            encryptionStatusElement.textContent = 'File encrypted successfully';

            // Create Blob and initiate automatic file download
            initDownoad(finalArray, 'SuperSecretFile.enc');

        } catch (e) {
            console.error('Encryption Error:', e);
            encryptionStatusElement.textContent = 'Encryption failed';
        }
    }

    encryptFileButton.addEventListener("click", encryptFile);
    decryptFileButton.addEventListener("click", decryptFile);

    async function decryptFile() {
        const decryptionStatusElement = document.getElementById('decryptionStatus');
        try {
            const file = document.getElementById("encryptedFileInput").files[0];
            if (!file) {
                decryptionStatusElement.textContent = 'No encrypted file selected';
                return;
            }

            const password = document.getElementById("recoveredPassword").value;
            if (!password) {
                decryptionStatusElement.textContent = 'Please enter a recovered password';
                return;
            }

            const keyBuffer = hexToArrayBuffer(password);
            const key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const fileBuffer = await file.arrayBuffer();
            const iv = new Uint8Array(fileBuffer, 0, 12);
            const encryptedData = new Uint8Array(fileBuffer, 12);


            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedData
            );

            const decryptedArray = new Uint8Array(decryptedData);
            const delimiter = new TextEncoder().encode("||");
            let delimiterIndex = -1;
            for (let i = 0; i < decryptedArray.length - delimiter.length + 1; i++) {
                if (decryptedArray.slice(i, i + delimiter.length).every((val, index) => val === delimiter[index])) {
                    delimiterIndex = i;
                    break;
                }
            }

            if (delimiterIndex === -1) {
                console.error("Delimiter not found");
                return;
            }
            const metadataBuffer = decryptedArray.slice(0, delimiterIndex);
            const metadataString = new TextDecoder().decode(metadataBuffer);
            const metadata = JSON.parse(metadataString);
            const originalFileName = metadata.fileName;

            const originalFileData = decryptedArray.slice(delimiterIndex + delimiter.length);

            initDownoad(originalFileData, originalFileName);

            decryptionStatusElement.textContent = 'File decrypted successfully';
        } catch (e) {
            console.error('Decryption Error:', e);
            decryptionStatusElement.textContent = 'Decryption failed';
        }
    }

    function generateKeys(seedPhrase, derivationPath) {
        const wallet = ethers.Wallet.fromMnemonic(seedPhrase, derivationPath);
        const privateKey = wallet.privateKey;
        const publicKey = wallet.publicKey;
        const address = wallet.address;
    
        return { privateKey, publicKey, address };
    }
    
    const generatePrivateKey = () => {
        const seedPhrase = document.getElementById('mnemonic').value;
        const derivationPath = document.getElementById('derivationPath').value;
        const keys = generateKeys(seedPhrase, derivationPath);
        document.getElementById('generatedPrivateKey').value = keys.privateKey;
        document.getElementById('walletAddress').innerText = keys.address;
    }
    
    async function decryptMessage() {
        const privateKey = document.getElementById('generatedPrivateKey').value;
        const encryptedMessage = document.getElementById('encryptedMessageInput').value;
        try {
            const decrypted = await EthCrypto.decryptWithPrivateKey(
                privateKey,
                EthCrypto.cipher.parse(encryptedMessage)
            );
            document.getElementById('decryptedMessage').value = decrypted;
        } catch (error) {
            let errorMessage = 'Decryption failed: ' + error.message;
            if (error.message.toLowerCase().includes('bad mac')) {
                errorMessage += '\nThis usually indicates a wrong private key.';
            }
            alert(errorMessage);
        }
    }
    
    async function encryptMessage() {
        const message = document.getElementById('message').value;
        const publicKey = document.getElementById('publicKey').value.trim();
        try {
            const encrypted = await EthCrypto.encryptWithPublicKey(
                hexToUint8Array(publicKey),
                message
            );
            const encryptedString = EthCrypto.cipher.stringify(encrypted);
            document.getElementById('encryptedMessage').value = encryptedString;
        } catch (error) {
            console.error('Encryption failed:', error.message);
        }
    }

    window.encryptMessage = encryptMessage;     // Expose function globally for use in HTML
    window.generatePrivateKey = generatePrivateKey;  // Expose function globally for use in HTML
    window.decryptMessage = decryptMessage;  // Expose function globally for use in HTML
});
