var uploadWorkloadFileWorker = new Worker('js/uploadWorkloadFileWorker.js');

function uploadWorkloadFile(event) {
    // Clear workload
    clearWorkload();

    // Get selected file
    const selectedFile = event.srcElement.files[0];
    document.getElementById("workload-input-file-name").innerHTML = "loading... " + selectedFile.name;
    
    document.getElementById("workload-input-file-invalid").innerHTML = "";
    document.getElementById("loading_workload_percentage").innerHTML = "0%";

    // Show indicator
    document.getElementById("loading_indicator_2").style.opacity = 1;

    uploadWorkloadFileWorker = new Worker('js/uploadWorkloadFileWorker.js');

    uploadWorkloadFileWorker.addEventListener('message', onUploadWorkloadFileWorkerMessage);

    uploadWorkloadFileWorker.postMessage({selectedFile: selectedFile, keyHash: KeyHash});
}

function clearWorkload() {
    var queries = "";
    var pointLookupsPercent = "";
    var zeroResultPointLookupsPercent = "";
    var writesPercent = "";
    document.getElementById("query_count").value = numberWithCommas(queries);
    document.getElementById("v").value = pointLookupsPercent;
    document.getElementById("r").value = zeroResultPointLookupsPercent;
    document.getElementById("w").value = writesPercent;
}

function onUploadWorkloadFileWorkerMessage(e) {
    switch (e.data.msg) {
        case 'percentage':
            displayWorkloadPercentage(e.data);
            break;
        case 'invalid':
            displayWorkloadError();
            break;
        case 'inputs':
            displayWorkloadInputs(e.data);
            break;
        default:
            break;
    }
}

function displayWorkloadPercentage(data) {
    var percentage = data.percentage;
    document.getElementById("loading_workload_percentage").innerHTML = percentage + "%";
}

function displayWorkloadError() {
    document.getElementById("workload-input-file-invalid").innerHTML = "Invalid format";
}

function displayWorkloadInputs(data) {

    // Update the inputs
    document.getElementById("query_count").value = numberWithCommas(data.queries);
    document.getElementById("v").value = data.pointLookupsPercent;
    document.getElementById("r").value = data.zeroResultPointLookupsPercent;
    document.getElementById("w").value = data.writesPercent;
    document.getElementById("workload-input-file-name").innerHTML = data.fileName;

    // Hide indicator
    document.getElementById("loading_indicator_2").style.opacity = 0;

    uploadWorkloadFileWorker.terminate();
}