function checkAuthentication() {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!isAuthenticated) {
        localStorage.setItem("intendedPage", window.location.pathname);
        window.location.href = "../login/index.html";
    }
}


window.onload = checkAuthentication;


function logout() {
    localStorage.removeItem("isAuthenticated");
    window.location.href = "../login/index.html";
}

let combinedResult = "";

function parseInput(input) {
    const lines = input.split("\n").filter((line) => line.trim());
    const result = {};
    lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
            const time = parts[0];
            const pair = parts[1];
            const type = parts[2];
            const direction = parts[3] || ""; // Capture direction if it exists
            result[time] = { time, pair, type, direction };
        }
    });
    return result;
}

function getHeader(input) {
    const lines = input.split("\n").filter((line) => line.trim());
    return lines.length > 1 ? lines[0] + "\n" + lines[1] + "\n" : "";
}

function combineInputs() {
    const inputA = document.getElementById("inputA").value;
    const inputB = document.getElementById("inputB").value;

    if (!inputA || !inputB) {
        alert("Please fill both Input A and Input B.");
        return;
    }

    const header = getHeader(inputA);

    const bodyA = inputA.split("\n").slice(2).join("\n");
    const bodyB = inputB.split("\n").slice(2).join("\n");

    const parsedA = parseInput(bodyA);
    const parsedB = parseInput(bodyB);

    const combined = { ...parsedA, ...parsedB };
    const sortedTimes = Object.keys(combined).sort();

    combinedResult =
        header +
        sortedTimes
            .map((time) => {
                const { time: t, pair, type, direction } = combined[time];
                let formattedLine = `${t} ${pair} ${type}`;
                if (type === "PUT") {
                    formattedLine += " "; // Add extra space after "PUT"
                }
                if (direction) {
                    formattedLine += ` ${direction}`; // Append direction if exists
                }
                return formattedLine;
            })
            .join("\n");

    const resultElement = document.getElementById("result");
    resultElement.textContent = combinedResult;

    document.getElementById("result-container").style.display = "block";
    document.getElementById("downloadBtn").style.display = "inline-block";
    document.getElementById("combineBtn").innerHTML =
        "<i class='fas fa-sync-alt'></i> RE-COMBINE";
    document.getElementById("combineBtn").style.display = "inline-block";
    document.getElementById("regenerateBtn").style.display = "none";
}

document
    .getElementById("inputA")
    .addEventListener("input", showRegenerateButton);
document
    .getElementById("inputB")
    .addEventListener("input", showRegenerateButton);

function showRegenerateButton() {
    document.getElementById("regenerateBtn").style.display = "inline-block";
}

function downloadTxtFile() {
    const element = document.createElement("a");
    const file = new Blob([combinedResult], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "combined_result.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function openHelpPopup() {
    document.getElementById("helpPopup").style.display = "block";
}

function closeHelpPopup() {
    document.getElementById("helpPopup").style.display = "none";
}