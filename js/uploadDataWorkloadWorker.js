var KeyHash = new Object();
var U_Parameters = {};

onmessage = function(e) {
    if(e.data.from == "data") {
        loadDataFile(e);
    } else {
        loadWorkloadFile(e);
    }
}

// data file
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

    var keyHash = new Object();
    var frequencyKeys = [];

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

            if (undefined == keyHash["" + key]) {
                keyHash["" + key] = 1;
            } else {
                keyHash["" + key] += 1;
            }
        }         

        var per = Math.ceil((i+1) / lines.length * 1000) / 10;
        per = Math.max(0.1, per);
        per = Math.min(99.7, per);

        if(per != percentage) {
            percentage = per;
            postMessage({to: "data", msg: "percentage", percentage: percentage});
        }
    }

    for (const property in keyHash) {
        frequencyKeys.push({key: Number(property), frequency: keyHash[property]});
    }
    frequencyKeys.sort(function(a,b){return a.key - b.key;});
    
    var uParameters = highestFrequencyPartitions(frequencyKeys);
    uParameters['U'] = maxKey * 100;

    var totalKeys = 0;
    for (var key of frequencyKeys) {
        totalKeys += key.frequency;
    }
    uParameters['p_put'] = Math.round(uParameters['specialKeys']/totalKeys*100)/100;

    if(isValid) {
        keySize = Math.ceil(Math.log2(maxKey)/8);
        valueSize = Math.ceil(Math.log2(maxValue)/8);
        entrySize = keySize + valueSize;
    } else {
        postMessage({to: "data", msg: "invalid"});
    }
    
    KeyHash = keyHash;
    U_Parameters = uParameters;

    // Update the inputs
    postMessage({to: "data", msg: "inputs", entries: entries, entrySize: entrySize, keySize: keySize, fileName: e.data.selectedFile.name, uParameters: uParameters});
}

// To calculate U1 and U2:
//  find partitions with highest frequency with an array of entries as input
// 	 1. divide it into M partitions
// 	 2. for each partition calculate the average frequency
// 	 3. return the partitions with the highest frequency
//   4. calculate U1 and then U2
function highestFrequencyPartitions(entries) {
    var min = entries[0].key;
    var max = entries[entries.length - 1].key;
    var PARTITION_RANGE = 1000;
    var N = (max - min)/PARTITION_RANGE;
    var partitions = [];
    var entriesIndex = 0;

    // Partition:
    //  start point
    //  end point
    //  number of keys
    //  total frequency
    const START_POINT = 0;
    const END_POINT = 1;
    const NUMBER_KEYS = 2;
    const TOTAL_FREQUENCY = 3;
    for(var i = 0; i < N - 1; i++) {
        partitions[i] = [0, 0, 0, 0];
        var startPoint = i * PARTITION_RANGE + min;
        var endPoint = (i + 1) * PARTITION_RANGE + min;
        var numberKeys = 0;
        var totalFrequency = 0;
        while(entriesIndex < entries.length && startPoint <= entries[entriesIndex].key && entries[entriesIndex].key  < endPoint) {
            numberKeys++;
            totalFrequency += entries[entriesIndex].frequency;
            entriesIndex++; 
        }
        partitions[i][START_POINT] = startPoint;
        partitions[i][END_POINT] = endPoint;
        partitions[i][NUMBER_KEYS] = numberKeys;
        partitions[i][TOTAL_FREQUENCY] = totalFrequency;
    }
    partitions[N - 1] = [0, 0, 0, 0];
    var startPoint = (N - 1) * PARTITION_RANGE + min;
    var endPoint = N * PARTITION_RANGE + min;
    var numberKeys = 0;
    var totalFrequency = 0;
    while(entriesIndex < entries.length) {
        numberKeys++;
        totalFrequency += entries[entriesIndex].frequency;
        entriesIndex++; 
    }
    partitions[N - 1][START_POINT] = startPoint;
    partitions[N - 1][END_POINT] = endPoint;
    partitions[N - 1][NUMBER_KEYS] = numberKeys;
    partitions[N - 1][TOTAL_FREQUENCY] = totalFrequency;

    partitions = removeEmptyPartitions(partitions);

    // Sort array by average frequencies
    partitions.sort(function(a,b){return (b[TOTAL_FREQUENCY] / b[NUMBER_KEYS]) - (a[TOTAL_FREQUENCY] / a[NUMBER_KEYS]);});

    var avgAvgFrequency = 0;
    for(var partition of partitions) {
        var avg = (partition[TOTAL_FREQUENCY] / partition[NUMBER_KEYS]);
        avgAvgFrequency += avg;
    }
    avgAvgFrequency /= N;

    var start = max;
    var end = min;
    var specialKeys = 0;
    var avgFrequency = partitions[0][TOTAL_FREQUENCY] / partitions[0][NUMBER_KEYS];
    var thresholdFrequency = 1.5 * avgAvgFrequency;
    for(var i = 0; i < partitions.length && avgFrequency > thresholdFrequency; i++) {
        start = Math.min(start, partitions[i][START_POINT]);
        end = Math.max(end, partitions[i][END_POINT]);
        specialKeys += partitions[i][TOTAL_FREQUENCY];
        avgFrequency = partitions[i+1][TOTAL_FREQUENCY] / partitions[i+1][NUMBER_KEYS];
    }
    U_1 = end - start;
    U_2 = (max - min) - U_1;

    return {U_1: U_1, U_2: U_2, specialKeys: specialKeys};
}

function removeEmptyPartitions(partitions) {
    const NUMBER_KEYS = 2;
    var newPartitions = [];
    for(var partition of partitions) {
        if(partition[NUMBER_KEYS] != 0) {
            newPartitions.push(partition);
        }
    }
    return newPartitions;
}

// workload file
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

    var keyHash = KeyHash;
    var specialGets = 0;
    var totalGets = 0;

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
                    totalGets++;
                    if(key <= U_Parameters['U_1']) {
                        specialGets++;
                    }
                } else {
                    zeroResultPointLookups += 1;
                    totalGets++;
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
            postMessage({to: "workload", msg: "percentage", percentage: percentage});
        }          
    }

    U_Parameters['p_get'] = Math.round(specialGets/totalGets*100)/100;

    if(isValid) {
        pointLookupsPercent = Math.round(pointLookups/queries*100)/100;
        zeroResultPointLookupsPercent = Math.round(zeroResultPointLookups/queries*100)/100;
        writesPercent = Math.round(writes/queries*100)/100;
    } else {
        postMessage({to: "workload", msg: "invalid"});
    }

    // Update the inputs
    postMessage({to: "workload", msg: "inputs", queries: queries, pointLookupsPercent: pointLookupsPercent, zeroResultPointLookupsPercent: zeroResultPointLookupsPercent, writesPercent: writesPercent, fileName: e.data.selectedFile.name, uParameters: U_Parameters});
}