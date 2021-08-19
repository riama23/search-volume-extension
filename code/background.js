function reload() {
    window.location.reload()
}

chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        //   files: ['content.js']
        func: reload
    });
});