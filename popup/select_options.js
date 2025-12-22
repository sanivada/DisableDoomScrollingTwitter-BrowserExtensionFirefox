const input = document.getElementById("limit");
const button = document.getElementById("submit");

button.addEventListener("click", () => {
    // get the value from input
    const limitValue = input.valueAsNumber;

    if (!limitValue) {
        // if null handle
        // show error
        return;
    };

    // store the value
    browser.storage.local.set({
        xPostLimitNum: limitValue
    }).then(() => {
        button.textContent = "Limit set!"
    })
    console.log(`value is set: ${limitValue}`);
});

browser.storage.local.get("xPostLimitNum").then((result) => {
    let limitValueFromStorage = result.xPostLimitNum;
    console.log(`value retrieved from storage: ${limitValueFromStorage}`);
    if (limitValueFromStorage) {
        input.valueAsNumber = limitValueFromStorage;
    };
});
