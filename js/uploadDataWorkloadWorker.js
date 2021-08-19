

var KeyHash = new Object();
var U_Parameters = {};
var total_lines = 0;
/**
 * Receive message from upload data and workload
 */
onmessage = function (e) {
    if (e.data.from == "data") {
        loadDataFile(e, function() {});
    } else {
        loadWorkloadFile(e);
    }
}

/**
 * Read data from data file and call loadData
 * @param {*} e
 */
function loadDataFile(e, callback) {

    var startDay = new Date();
    var startTime = startDay.getTime();

    var file = e.data.selectedFile;
    var fileSize = file.size;
    var chunkSize = 1024*1024// bytes
    var offset = 0;
    var leftover = "";
    var self = this; // we need a reference to the current object
    var chunkReaderBlock = null;
    var done = false;
    var uniform = e.data.uniform;
    var metadata = {maxKey: -2147483648, minKey: 2147483648, maxValue: "", partitions: [],/* keyHash: new Object(), frequencyKeys: [],*/ uParameters: {}}
    var percentage = 0;
    var total_lines = 0;
    var pass = 1;
    var readEventHandler = function (evt) {
        if (evt.target.error == null) {
            var lines = (leftover + evt.target.result).split('\n');
            leftover = lines[lines.length - 1];
            lines = lines.slice(0, lines.length - 1);
            done = offset+chunkSize >= fileSize;
            
            if (pass===1) {
                metadata = loadData(e, lines, uniform, metadata, done);
                total_lines = total_lines + lines.length;
            }
            else if (pass===2) {
                if (uniform) {
                    metadata['uParameters']['U'] == 100 * metadata['maxKey'];
                }
                else {
                    metadata = loadSkewParameters(e, lines, metadata, done);
                }
            }
            // Calculate and update loading percentage
            var per = Math.ceil(offset / fileSize * 1000) / 20 + 50 * (pass - 1);
            per = Math.max(0.1, per);
            per = Math.min(99.7, per);

            if (per != percentage) {
                percentage = per;
                postMessage({to: "data", msg: "percentage", percentage: percentage});
            }

            offset += chunkSize;

            callback(evt.target.result); // callback for handling read chunk
        } else {
            console.log("Read error: " + evt.target.error);
            return;
        }
        if (done && pass===2) {
            console.log("lines="+total_lines);
            console.log("Done reading file");
            var endDay = new Date();
            var endTime = endDay.getTime();
            console.log("Run time: " + (endTime-startTime));
            // Update the inputs
            postMessage({
                to: "data",
                msg: "inputs",
                entries: total_lines,
                entrySize: Math.ceil(Math.log2(metadata['maxKey']) / 8)+metadata['maxValue'].length,
                keySize: Math.ceil(Math.log2(metadata['maxKey']) / 8),
                fileName: e.data.selectedFile.name,
                uParameters: metadata['uParameters']
            });
            return;
        }
        else if (done && pass===1) {
            offset = 0;
            pass = 2;
            metadata['partitions'] = setUpPartitions(metadata);
        }

    // off to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
}

chunkReaderBlock = function (_offset, length, _file) {
    var r = new FileReader();
    var blob = _file.slice(_offset, length + _offset);
    r.onload = readEventHandler;
    r.readAsText(blob);
}

// now let's start the read with the first block
chunkReaderBlock(offset, chunkSize, file);

}

/**
 * Parse through data file and calculate data inputs
 * @param {*} e
 * @param {*} lines
 */
function loadData(e, lines, uniform, metadata, done) {
    var maxKey = metadata['maxKey'];
    var minKey = metadata['minKey'];
    var maxValue = metadata['maxValue'];
    //var keyHash = metadata['keyHash'];

    var isValid = true;

    // Parse through data file
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line != "" && line.indexOf("//") != 0) {

            if (line.indexOf("//") > 0) {
                line = line.split("//")[0].trim();
            }

            var entry = line.split(" ");

            // Check if entry is correct format
            if (!(entry.length == 2 && !isNaN(entry[0])) &&
                    !(entry.length == 3 && !(isNaN(entry[1])) && !(isNaN(entry[2])))) {
                entries = "";
                isValid = false;
                break;
            }

            var key, value;

            if (entry.length == 2) {
                key = Number(entry[0]);
                value = entry[1];
            } else {
                key = Number(entry[1]);
                value = entry[2];
            }

            maxKey = Math.max(maxKey, key);
            minKey = Math.min(minKey, key);
            if (maxValue.length < value.length) {
                maxValue = value;
            }
            /*
            // Add key to hash
            // 1 in 10 keys is stored in hash to prevent memory overflow
            if (Math.ceil(Math.random()*10) == 5) {
                if (undefined == keyHash["" + key]) {
                    keyHash["" + key] = 1;
                } else {
                    keyHash["" + key] += 1;
                }
            }*/
        }
    }

    if (isValid) {
        /*
        if (done) {

            var frequencyKeys = metadata['frequencyKeys'];
            var uParameters = metadata['uParameters'];

            // Turn hash into array
            for (const property in keyHash) {
                frequencyKeys.push({key: Number(property), frequency: keyHash[property]});
            }
            frequencyKeys.sort(function (a, b) {
                return a.key - b.key;
                });
            // Calculate U, U1, U2, and pput
            if (!uniform) {
                uParameters = highestFrequencyPartitions(frequencyKeys);
                var totalKeys = 0;
                for (var key of frequencyKeys) {
                    totalKeys += key.frequency;
                }
                uParameters['p_put'] = Math.round(uParameters['specialKeys'] / totalKeys * 100) / 100;
            } else {
                uParameters['U'] = maxKey * 100;
            }

            metadata['frequencyKeys'] = frequencyKeys;
            metadata['uParameters'] = uParameters;
            
            KeyHash = metadata['keyHash'];
            U_Parameters = metadata['uParameters'];
        }*/
    } else {
        postMessage({to: "data", msg: "invalid"});
    }


    metadata['maxKey'] = maxKey;
    metadata['minKey'] = minKey;
    metadata['maxValue'] = maxValue;
    //metadata['keyHash'] = keyHash;

    return metadata;
}

function loadSkewParameters(e, lines, metadata, done) {

    var partitions = metadata['partitions'];
    const START_POINT = 0;
    const END_POINT = 1;
    const TOTAL_FREQUENCY = 2;

    // Parse through data file
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line != "" && line.indexOf("//") != 0) {

            if (line.indexOf("//") > 0) {
                line = line.split("//")[0].trim();
            }

            var entry = line.split(" ");

            var key;

            if (entry.length == 2) {
                key = Number(entry[0]);
            } else {
                key = Number(entry[1]);
            }

            //Add the key to the appropriate partition 
            
            var j = 0;
            var current_end;
            
            do {
                current_end = partitions[j][END_POINT];
                j++;
            }
            while (key >= current_end);

            partitions[j-1][TOTAL_FREQUENCY]++;
        }
    }
    
    if (done) {
        //Calculate U parameters
        var nonemptyPartitions = 0;
        var totalKeys = 0;

        for (var i = 0; i<partitions.length; i++) {
            if (partitions[i][TOTAL_FREQUENCY] != 0) {
                nonemptyPartitions++;
                totalKeys += partitions[i][TOTAL_FREQUENCY];
            }
        }

        var avgFrequency = totalKeys / nonemptyPartitions;
        
        var thresholdValue = 2;
        var startU1;
        var endU1;
        var hotPartitions = 0;
        var specialKeys = 0;
        
        //Uses a moving average to determine if the current partition is hot
        //This method smooths the distribution, preventing outliers from being counted
        var movingTotal = 0;
        var movingAvg = 0;
        var currentWindow = 0;
        var windowSize = 5;

        for (var i = 0; i < (windowSize - 1) / 2; i++) {
            movingTotal += partitions[i][TOTAL_FREQUENCY];
            currentWindow++;
        }

        for (var i = 0; i<partitions.length; i++) {
            if (i < partitions.length - (windowSize - 1) / 2) {
                movingTotal += partitions[i + (windowSize - 1) / 2][TOTAL_FREQUENCY];
                currentWindow++;
            }

            if (i >= (windowSize + 1) / 2) {
                movingTotal -= partitions[i - (windowSize + 1) / 2][TOTAL_FREQUENCY];
                currentWindow--;
            }
            
            movingAvg = movingTotal / currentWindow;
            
            if (movingAvg >= thresholdValue * avgFrequency) {
                if (hotPartitions === 0) {
                    startU1 = partitions[i][START_POINT];
                }
                endU1 = partitions[i][END_POINT];
                hotPartitions++;
                specialKeys += partitions[i][TOTAL_FREQUENCY];
            }
        }
        U_1 = endU1 - startU1;
        U_2 = (partitions[partitions.length - 1][END_POINT] - partitions[0][START_POINT]) - U_1;
        var p_put = Math.round(specialKeys / totalKeys * 100) / 100;
        

        metadata['uParameters'] = {U_1: U_1, U_2: U_2, p_put: p_put, specialKeys: specialKeys, start: startU1, end: endU1};

        U_Parameters = metadata['uParameters'];
    }

    metadata['partitions'] = partitions;

    return metadata;
} 

function setUpPartitions(metadata) {
    var min = metadata['minKey'];
    var max = metadata['maxKey'];
    var i = 1;
    while ((max - min) % i != (max - min)) {
        i = i * 10;
    }
    var PARTITION_RANGE = i / 1000000;
    var numPartitions = Math.round((max - min) / PARTITION_RANGE) + 1;
    var partitions = [];
    // Partition:
    //  start point
    //  end point
    //  total frequency

    // Set up ranges on each partition
    const START_POINT = 0;
    const END_POINT = 1;
    for (var i = 0; i < numPartitions; i++) {
        partitions[i] = [0, 0, 0];
        var startPoint = i * PARTITION_RANGE + min;
        var endPoint = (i + 1) * PARTITION_RANGE + min;

        partitions[i][START_POINT] = startPoint;
        partitions[i][END_POINT] = endPoint;
    }

    return partitions;
}

/**
 * Divide entries into partitions to calculate U1 and U2
 * @param {*} entries
 */
function highestFrequencyPartitions(entries) {
    var min = entries[0].key;
    var max = entries[entries.length - 1].key;
    var i = 1;
    while ((max - min) % i != (max - min)) {
        i = i * 10;
    }
    var PARTITION_RANGE = i / 1000000;
    var numPartitions = Math.round((max - min) / PARTITION_RANGE);
    var partitions = [];
    var entriesIndex = 0;
    var thresholdValue = 1.5;
    // Partition:
    //  start point
    //  end point
    //  number of keys
    //  total frequency

    // Divide entries into n partitions
    const START_POINT = 0;
    const END_POINT = 1;
    const NUMBER_KEYS = 2;
    const TOTAL_FREQUENCY = 3;
    for (var i = 0; i < numPartitions - 1; i++) {
        partitions[i] = [0, 0, 0, 0];
        var startPoint = i * PARTITION_RANGE + min;
        var endPoint = (i + 1) * PARTITION_RANGE + min;
        var numberKeys = 0;
        var totalFrequency = 0;
        while (entriesIndex < entries.length && startPoint <= entries[entriesIndex].key && entries[entriesIndex].key < endPoint) {
            numberKeys++;
            totalFrequency += entries[entriesIndex].frequency;
            entriesIndex++;
        }
        partitions[i][START_POINT] = startPoint;
        partitions[i][END_POINT] = endPoint;
        partitions[i][NUMBER_KEYS] = numberKeys;
        partitions[i][TOTAL_FREQUENCY] = totalFrequency;
    }
    partitions[numPartitions - 1] = [0, 0, 0, 0];
    var startPoint = (numPartitions - 1) * PARTITION_RANGE + min;
    var endPoint = numPartitions * PARTITION_RANGE + min;
    var numberKeys = 0;
    var totalFrequency = 0;
    while (entriesIndex < entries.length) {
        numberKeys++;
        totalFrequency += entries[entriesIndex].frequency;
        entriesIndex++;
    }
    partitions[numPartitions - 1][START_POINT] = startPoint;
    partitions[numPartitions - 1][END_POINT] = endPoint;
    partitions[numPartitions - 1][NUMBER_KEYS] = numberKeys;
    partitions[numPartitions - 1][TOTAL_FREQUENCY] = totalFrequency;

    partitions = removeEmptyPartitions(partitions);

    // Sort array by average frequencies
    partitions.sort(function (a, b) {
            return (b[TOTAL_FREQUENCY] / b[NUMBER_KEYS]) - (a[TOTAL_FREQUENCY] / a[NUMBER_KEYS]);
            });

    // Find the mean of the average frequencies
    var meanAvgFrequency = 0;
    for (var partition of partitions) {
        var avg = (partition[TOTAL_FREQUENCY] / partition[NUMBER_KEYS]);
        meanAvgFrequency += avg;
    }
    meanAvgFrequency /= partitions.length;

    // Find the partitions with the highest frequency
    // Calculate U1 and then U2
    var start = max;
    var end = min;
    var specialKeys = 0;
    var avgFrequency = partitions[0][TOTAL_FREQUENCY] / partitions[0][NUMBER_KEYS];
    var thresholdFrequency = thresholdValue * meanAvgFrequency;
    for (var i = 0; i + 1 < partitions.length && avgFrequency > thresholdFrequency; i++) {
        start = Math.min(start, partitions[i][START_POINT]);
        end = Math.max(end, partitions[i][END_POINT]);
        specialKeys += partitions[i][TOTAL_FREQUENCY];
        avgFrequency = partitions[i + 1][TOTAL_FREQUENCY] / partitions[i + 1][NUMBER_KEYS];
    }
    U_1 = end - start;
    U_2 = (max - min) - U_1;

    return {U_1: U_1, U_2: U_2, specialKeys: specialKeys, start: start, end: end};
}

/**
 * Remove partitions with no keys
 * @param {*} partitions
 */
function removeEmptyPartitions(partitions) {
    const NUMBER_KEYS = 2;
    var newPartitions = [];
    for (var partition of partitions) {
        if (partition[NUMBER_KEYS] != 0) {
            newPartitions.push(partition);
        }
    }
    return newPartitions;
}

function round1000(x) {
    return Math.round(x * 1000) / 1000;
}

/**
 * Read data from workload file and call loadWorkload
 * @param {*} e
 */
function loadWorkloadFile(e) {

    var startDay = new Date();
    var startTime = startDay.getTime();

    var file = e.data.selectedFile;
    var fileSize = file.size;
    var chunkSize = 1024*1024;
    var offset = 0;
    var leftover = "";
    console.log("File size: " + fileSize);

    var ops = {
         queries: 0,
         pointLookups: 0,
         zeroResultPointLookups: 0,
         inserts: 0,
         blindUpdates: 0,
         readModifyUpdates: 0,
         nonEmptyRangeLookups: 0,
         emptyRangeLookups: 0,
         targetRangeSize: "",

         done: false,
         isValid: true,

         keyHash: KeyHash,
         specialGets: 0,
         totalGets: 0,
    }
    var postPercentage = function (_offset, _fileSize) {
        // Calculate and update loading percentage
        var per = Math.ceil((_offset) / _fileSize * 1000) / 10;
        per = Math.max(0.1, per);
        per = Math.min(99.7, per);

        postMessage({to: "workload", msg: "percentage", percentage: per});
    }

    var readEventHandler = function (evt) {
        //console.log("Offset: " + offset);
        var lines = (leftover + evt.target.result).split('\n');
        leftover = lines[lines.length - 1];
        lines = lines.slice(0, lines.length - 1);
        //console.log("Leftover: " + leftover);
        ops.done = offset+chunkSize >= fileSize;

        loadWorkload(e, lines, ops);

        postPercentage(offset, fileSize);

        offset += chunkSize;
        if (offset >= fileSize) {
            console.log("Done reading workload file");

            var endDay = new Date();
            var endTime = endDay.getTime();
            console.log("Run time: " + (endTime-startTime));
        }
        else {
            chunkReaderBlock(offset, chunkSize, file);
        }
    }
    chunkReaderBlock = function (_offset, length, _file) {
        var r = new FileReader();
        var blob = _file.slice(_offset, length + _offset);
        r.onload = readEventHandler;
        r.readAsText(blob);
    }

    chunkReaderBlock(offset, chunkSize, file);
}

/**
 * Parse through workload file and calculate workload inputs
 * @param {*} e
 * @param {*} lines
 */
function loadWorkload(e, lines, ops) {

    var pointLookupsPercent = "";
    var zeroResultPointLookupsPercent = "";
    var insertsPercent = "";
    var blindUpdatesPercent = "";
    var readModifyUpdatesPercent = "";
    var nonEmptyRangeLookupsPercent = "";
    var emptyRangeLookupsPercent = "";


    // Parse through workload file
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        //Looks for lines that aren't empty or comments
        if (line != "" && line.indexOf("//") != 0) {

            if (line.indexOf("//") > 0) {
                line = line.split("//")[0].trim();
            }

            ops.queries += 1;

            var query = line.split(" ");

            // Parse the type of query
            if (query.length == 3 && !isNaN(query[1]) && !isNaN(query[2])) {
                if (query[0] === 'r') {
                    ops.targetRangeSize = query[2];
                    ops.nonEmptyRangeLookups += 1;
                }
                else if (query[0] === 'e') {
                    ops.targetRangeSize = query[2];
                    ops.emptyRangeLookups += 1;
                }
                else {
                    ops.queries = "";
                    ops.isValid = false;
                    break;
                }
            } else if (query.length == 3 && !isNaN(query[1]) && isNaN(query[2])) {
                var key = query[1];
/*                if (undefined == ops.keyHash["" + key]) {
                    ops.keyHash["" + key] = 1;
                } else {
                    ops.keyHash["" + key] += 1;
                }
*/
                if (query[0] === 'i') {
                    ops.inserts += 1;
                }
                else if (query[0] === 'u') {
                    ops.blindUpdates += 1;
                }
                else if (query[0] === 'w') {
                    ops.readModifyUpdates += 1;
                }
                else {
                    ops.queries = "";
                    ops.isValid = false;
                    break;
                }
            } else if (query.length == 2 && !isNaN(query[1])) {
                if (query[0] === 'l') { 
                    var key = query[1];
                    ops.pointLookups += 1;
                    ops.totalGets++;
                    if (U_Parameters['start'] <= key && key <= U_Parameters['end']) {
                        ops.specialGets++;
                    }
                }
                else if (query[0] === 'z') {
                    ops.zeroResultPointLookups += 1;
                    ops.totalGets++;
                }
                else {
                    ops.queries = "";
                    ops.isValid = false;
                    break;
                }
            } else {
                ops.queries = "";
                ops.isValid = false;
                break;
            }
        }

    } //for

    if (ops.done) {
        if (ops.isValid) {
            pointLookupsPercent = round1000(ops.pointLookups / ops.queries);
            zeroResultPointLookupsPercent = round1000(ops.zeroResultPointLookups / ops.queries);
            insertsPercent = round1000(ops.inserts / ops.queries);
            blindUpdatesPercent = round1000(ops.blindUpdates / ops.queries);
            readModifyUpdatesPercent = round1000(ops.readModifyUpdates / ops.queries);
            nonEmptyRangeLookupsPercent = round1000(ops.nonEmptyRangeLookups / ops.queries);
            emptyRangeLookupsPercent = round1000(ops.emptyRangeLookups / ops.queries);


            // Calculate pget
            U_Parameters['p_get'] = Math.round(ops.specialGets / ops.totalGets * 100) / 100;
        } else {
            postMessage({to: "workload", msg: "invalid"});
        }

        // Update the inputs
        postMessage({
            to: "workload",
            msg: "inputs",
            queries: ops.queries,
            pointLookupsPercent: pointLookupsPercent,
            zeroResultPointLookupsPercent: zeroResultPointLookupsPercent,
            insertsPercent: insertsPercent,
            blindUpdatesPercent: blindUpdatesPercent,
            readModifyUpdatesPercent: readModifyUpdatesPercent,
            nonEmptyRangeLookupsPercent: nonEmptyRangeLookupsPercent,
            emptyRangeLookupsPercent: emptyRangeLookupsPercent,
            targetRangeSize: ops.targetRangeSize,
            fileName: e.data.selectedFile.name,
            uParameters: U_Parameters
        });
    }
}
