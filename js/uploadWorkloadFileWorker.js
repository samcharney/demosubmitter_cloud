function loadWorkloadFile(e){
    var reader = new FileReader();
    reader.onload = function(evt) {
        var lines = evt.target.result.split('\n');
        loadWorkload(e, lines);
    };
    reader.readAsText(e.data.selectedFile);
}

function loadWorkload(e, lines) {
    var queries = 0;
    var pointLookups = 0;
    var zeroResultPointLookups = 0;
    var writes = 0;
    
    var isValid = true;
    var pointLookupsPercent = "";
    var zeroResultPointLookupsPercent = "";
    var writesPercent = "";

    var keyHash = Object.assign({}, e.data.keyHash);

    var percentage = 0;

    for(var i = 0; i < lines.length; i++){
        var line = lines[i];

        if(line != "") {
            queries += 1;

            var query = line.split(" ");

            if(query.length == 3 && query[0] == "p" && !isNaN(query[1]) && !isNaN(query[2])) {
                var key = query[1];
                if (undefined == keyHash["" + key]) {
                    keyHash["" + key] = 1;
                } else {
                    keyHash["" + key] += 1;
                }
                writes += 1;
            } else if(query.length == 2 && query[0] == "g" && !isNaN(query[1])) {
                var key = query[1];
                if(undefined !== keyHash["" + key]) {
                    pointLookups += 1;
                } else {
                    zeroResultPointLookups += 1;
                }
            } else {
                queries = "";
                isValid = false;
                break;
            }
        }  

        var per = Math.ceil((i+1) / lines.length * 1000) / 10;
        per = Math.max(0.1, per);
        per = Math.min(99.7, per);

        if(per != percentage) {
            percentage = per;
            postMessage({msg: "percentage", percentage: percentage});
        }          
    }

    if(isValid) {
        pointLookupsPercent = Math.round(pointLookups/queries*100)/100;
        zeroResultPointLookupsPercent = Math.round(zeroResultPointLookups/queries*100)/100;
        writesPercent = Math.round(writes/queries*100)/100;
    } else {
        postMessage({msg: "invalid"});
    }

    // Update the inputs
    postMessage({msg: "inputs", queries: queries, pointLookupsPercent: pointLookupsPercent, zeroResultPointLookupsPercent: zeroResultPointLookupsPercent, writesPercent: writesPercent, fileName: e.data.selectedFile.name});
}

onmessage = function(e) {
    loadWorkloadFile(e);
}

// Functions that could be used in the future:
// function calcFrequency(keyHash, workloadKeyHash) {
//     var workloadFrequency = { 
//         regular: { frequency: 0, percent: 0 },
//         special: { frequency: 0, percent: 0 },
//         total: { frequency: 0, percent: 0 }
//     }
//     countFrequency(keyHash, workloadFrequency);
//     countFrequency(workloadKeyHash, workloadFrequency);
    
//     percentFrequency(workloadFrequency, workloadFrequency.regular);
//     percentFrequency(workloadFrequency, workloadFrequency.special);
//     percentFrequency(workloadFrequency, workloadFrequency.total);

//     return workloadFrequency;
// }

// function countFrequency(keyHash, workloadFrequency) {
//     for (const property in keyHash) {
//         var frequency = keyHash[property];
//         workloadFrequency.total.frequency += frequency;
//         if(frequency == 1) {
//             workloadFrequency.regular.frequency += frequency;
//         } else if (frequency > 1) {
//             workloadFrequency.special.frequency += frequency;
//         } else {
//             workloadFrequency.total.frequency -= frequency;
//         }
//     }
// }

// function percentFrequency(workloadFrequency, row) {
//     row.percent = Math.round(row.frequency / workloadFrequency.total.frequency * 10000) / 100;
// }