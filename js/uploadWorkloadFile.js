/**
 * Get selected workload file, show indicator, and call worker to calculate workload inputs
 * @param {*} event 
 */
function uploadWorkloadFile(event) {
    // Clear workload
    clearWorkload();

    // Get selected file
    const selectedFile = event.srcElement.files[0];
    document.getElementById("workload-input-file-name").innerHTML = "loading... " + selectedFile.name;
    
    document.getElementById("workload-input-file-invalid").innerHTML = "";
    document.getElementById("loading_workload_percentage").innerHTML = "0.1%";

    // Show indicator
    document.getElementById("loading_indicator_2").style.opacity = 1;

    // Call worker
    uploadDataWorkloadWorker.addEventListener('message', onUploadWorkloadFileWorkerMessage);
    uploadDataWorkloadWorker.postMessage({from: "workload", selectedFile: selectedFile});
}

/**
 * Clear data inputs: query_count, v, r, insert_workload, blind_update_workload, read_modify_update_worklaod, qL, qEL, s
 */
function clearWorkload() {
    var queries = "";
    var pointLookupsPercent = "";
    var zeroResultPointLookupsPercent = "";
    var insertsPercent = "";
    var blindUpdatesPercent = "";
    var readModifyUpdatesPercent = "";
    var NonEmptyRangeLookupsPercent = "";
    var EmptyRangeLookupsPercent = "";
    var TargetRangeSize = "";
    document.getElementById("query_count").value = numberWithCommas(queries);
    document.getElementById("v").value = pointLookupsPercent;
    document.getElementById("r").value = zeroResultPointLookupsPercent;
    document.getElementById("insert_workload").value = insertsPercent;
    document.getElementById("blind_update_workload").value = blindUpdatesPercent;
    document.getElementById("read_modify_update_workload").value = readModifyUpdatesPercent;
    document.getElementById("qL").value = NonEmptyRangeLookupsPercent;
    document.getElementById("qEL").value = EmptyRangeLookupsPercent; 
    document.getElementById("s").value = TargetRangeSize;
}

/**
 * Recive data from worker and display data or error
 * @param {*} e 
 */
function onUploadWorkloadFileWorkerMessage(e) {
    if(e.data.to == "workload") {
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
}

function displayWorkloadPercentage(data) {
    var percentage = data.percentage;
    document.getElementById("loading_workload_percentage").innerHTML = percentage + "%";
}

function displayWorkloadError() {
    document.getElementById("workload-input-file-invalid").innerHTML = "Invalid format";
    
    // Hide indicator
    document.getElementById("loading_indicator_2").style.opacity = 0;
}

function displayWorkloadInputs(data) {

    // Update the inputs
    document.getElementById("query_count").value = numberWithCommas(data.queries);
    document.getElementById("v").value = data.pointLookupsPercent;
    document.getElementById("r").value = data.zeroResultPointLookupsPercent;
    document.getElementById("insert_workload").value = data.insertsPercent;
    document.getElementById("blind_update_workload").value = data.blindUpdatesPercent;
    document.getElementById("read_modify_update_workload").value = data.readModifyUpdatesPercent;
    document.getElementById("qL").value = data.NonEmptyRangeLookupsPercent;
    document.getElementById("qEL").value = data.EmptyRangeLookupsPercent; 
    document.getElementById("s").value = data.TargetRangeSize;
    document.getElementById("workload-input-file-name").innerHTML = data.fileName;
    
    if(data.uParameters.p_put != 0) {
        p_get = data.uParameters.p_get;
    }

    // Hide indicator
    document.getElementById("loading_indicator_2").style.opacity = 0;

    // Clear input file
    document.getElementById("workload-input").value = "";
}
