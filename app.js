// JavaScript for tab switching
function openTab(tabName) {
    var i, tabContent;
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
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
        const generatedPassword = secrets.random(512); // Using secrets.random
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
        recoveredPasswordElement.textContent = `Recovered Password: ${recoveredPassword}`;
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
