document.addEventListener("DOMContentLoaded", function () {
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

        const numberOfShares = 5; // Total number of shares
        const minimumSharesRequired = 3; // Minimum shares required to recover

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

    splitSecretButton.addEventListener("click", splitPassword);

    const combineButton = document.getElementById("combineButton");
    const recoveredPasswordElement = document.getElementById("recoveredPassword");

    function combineShares() {
        const share1 = document.getElementById("shareInput1").value;
        const share2 = document.getElementById("shareInput2").value;
        const share3 = document.getElementById("shareInput3").value;

        // Add more shares if needed
        const sharesToCombine = [share1, share2, share3].filter(Boolean);  // Remove any empty shares

        if (sharesToCombine.length < 3) {  // Adjust the number based on your minimum required shares
            alert("Please enter at least 3 shares to combine.");  // Update the alert message accordingly
            return;
        }

        const recoveredPassword = secrets.combine(sharesToCombine);
        recoveredPasswordElement.textContent = `Recovered Password: ${recoveredPassword}`;
    }

combineButton.addEventListener("click", combineShares);
});
