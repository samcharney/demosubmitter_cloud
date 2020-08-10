var KeyHash = new Object();
var uploadDataFileWorker = new Worker('js/uploadDataFileWorker.js');

function uploadDataFile(event) {
    // Clear data
    clearData();

    // Get selected file
    const selectedFile = event.srcElement.files[0];
    document.getElementById("data-input-file-name").innerHTML = "loading... " + selectedFile.name;
    
    document.getElementById("data-input-file-invalid").innerHTML = "";
    document.getElementById("loading_data_percentage").innerHTML = "0.1%";

    // Show indicator
    document.getElementById("loading_indicator_1").style.opacity = 1;
    
    // Clear hash
    KeyHash = new Object(); 

    uploadDataFileWorker = new Worker('js/uploadDataFileWorker.js');

    uploadDataFileWorker.addEventListener('message', onUploadDataFileWorkerMessage);

    uploadDataFileWorker.postMessage({selectedFile: selectedFile, keyHash: KeyHash});
}

function clearData() {
    var entries = "";
    var keySize = "";
    var entrySize = "";
    document.getElementById("N").value = numberWithCommas(entries);
    document.getElementById("E").value = entrySize;
    document.getElementById("F").value = keySize;
}

function onUploadDataFileWorkerMessage(e) {
    KeyHash = e.data.keyHash;
    switch (e.data.msg) {
        case 'percentage':
            displayDataPercentage(e.data);
            break;
        case 'invalid':
            displayDataError();
            break;
        case 'inputs':
            displayDataInputs(e.data);
            break;
        default:
            break;
    }
}

function displayDataPercentage(data) {
    var percentage = data.percentage;
    document.getElementById("loading_data_percentage").innerHTML = percentage + "%";
}

function displayDataError() {
    document.getElementById("data-input-file-invalid").innerHTML = "Invalid format";
}

function displayDataInputs(data) {

    // Update the inputs
    document.getElementById("N").value = numberWithCommas(data.entries);
    document.getElementById("E").value = data.entrySize;
    document.getElementById("F").value = data.keySize;
    document.getElementById("data-input-file-name").innerHTML = data.fileName;

    // Hide indicator
    document.getElementById("loading_indicator_1").style.opacity = 0;

    uploadDataFileWorker.terminate();
}