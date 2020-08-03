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

    var keyHash = e.data.keyHash;

    var percentage = 0;

    for(var i = 0; i < lines.length; i++){
        var line = lines[i];

        if(line != "") {
            queries += 1;

            var query = line.split(" ");

            if(query.length == 3 && query[0] == "p" && !isNaN(query[1]) && !isNaN(query[2])) {
                var key = query[1];
                keyHash["" + key] = true;
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