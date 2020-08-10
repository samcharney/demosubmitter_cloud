function loadDataFile(e){
    var reader = new FileReader();
    reader.onload = function(evt) {
        var lines = evt.target.result.split('\n');
        loadData(e, lines);
    };
    reader.readAsText(e.data.selectedFile);
}

function loadData(e, lines) {
    var entries = 0;
    var maxKey = -2147483648;
    var maxValue = -2147483648;

    var isValid = true;
    var keySize = "";
    var valueSize = "";
    var entrySize = "";

    var keyHash = e.data.keyHash;

    var percentage = 0;
    
    for(var i = 0; i < lines.length; i++){
        var line = lines[i];

        if(line != "") {
            entries += 1;

            var entry = line.split(" ");

            if(!(entry.length == 2 && !entry.some(isNaN)) &&
               !(entry.length == 3 && !(isNaN(entry[1]))  && !(isNaN(entry[2])))) {
                entries = "";
                isValid = false;
                break;
            }

            var key, value;

            if(entry.length == 2) {
                key = Number(entry[0]);
                value = Number(entry[1]);
            } else {
                key = Number(entry[1]);
                value = Number(entry[2]);
            }

            maxKey = Math.max(maxKey, key);
            maxValue = Math.max(maxValue, value);

            keyHash["" + key] = 0;
            // if(undefined !== keyHash["" + key]) {
            //     keyHash["" + key] += 1;
            // } else {
            //     keyHash["" + key] = 0;
            // }
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
        keySize = Math.ceil(Math.log2(maxKey)/8);
        valueSize = Math.ceil(Math.log2(maxValue)/8);
        entrySize = keySize + valueSize;
    } else {
        postMessage({msg: "invalid"});
    }
    
    // Update the inputs
    postMessage({msg: "inputs", entries: entries, entrySize: entrySize, keySize: keySize, fileName: e.data.selectedFile.name, keyHash: keyHash});
}

onmessage = function(e) {
    loadDataFile(e);
}