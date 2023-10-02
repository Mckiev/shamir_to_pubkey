// JavaScript for tab switching
function openTab(tabName) {
    var i, tabContent;
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}

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

document.addEventListener("DOMContentLoaded", function () {
    // Open the first tab by default
    openTab('combineTab');
    
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

    // Display each share in separate table rows
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



    // Code to split the password
    splitSecretButton.addEventListener("click", splitPassword);

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
});


const fileInputElement = document.getElementById("fileInput");
const encryptFileButton = document.getElementById("encryptFile");
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


async function decryptFile() {
    const decryptionStatusElement = document.getElementById('decryptionStatus');
    try {
        const file = document.getElementById("encryptedFileInput").files[0];
        if (!file) {
            decryptionStatusElement.textContent = 'No encrypted file selected';
            return;
        }

        const password = document.getElementById("decryptionPasswordInput").value;
        if (!password) {
            decryptionStatusElement.textContent = 'Please enter a password';
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