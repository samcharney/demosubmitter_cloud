
var query_count = 10000000;
var read_percentage = 50;
var write_percentage = 100 - read_percentage;
var short_scan_percentage = 0;
var long_scan_percentage = 0;
var no_of_windows = 1;
var change_percent = 30;
var s = 64;
var head ;
var workload_exec_time = 0;
var total_budget;
var max_RAM_purchased; // in GB
var no_of_RAM_blocks;

var MIN_RAM_SIZE;
var RAM_BLOCK_COST;
var IOPS;
var network_bandwidth;

function Variables()
{
    var N;
    var E;
    var F;
    var B;
    var s;

    var cost;
    var scenario;

    var T;
    var K;
    var Z;
    var L;

    var w;
    var r;
    var v;
    var qL;
    var qS;

    var X; //updated entries in LL-Bush
    var Y;

    var Buffer;
    var M_F_HI;
    var M_F; // = ((B*E + (M - M_F)) > 0 ? B*E + (M - M_F) : (B*E)); // byte
    var M_F_LO; // = (M_B*(F)*T)/((B)*(E));
    var M_BF;
    var M_FP;
    var FPR_sum;

    var update_cost;
    var read_cost;
    var no_result_read_cost;
    var short_scan_cost;
    var long_scan_cost;
    var total_cost;

    var read_latency;
    var write_latency;

}

function parseInputVariables()
{
    var parsedBoxes = new Variables();

    //Dataset and Environment
    parsedBoxes.N = parseInt(document.getElementById("N").value.replace(/\D/g,''),10);
    parsedBoxes.E = parseInt(document.getElementById("E").value.replace(/\D/g,''),10);
    parsedBoxes.F = parseFloat(document.getElementById("F").value);
    parsedBoxes.B = parseInt(document.getElementById("B").value.replace(/\D/g,''), 10);
    parsedBoxes.cost = parseInt(document.getElementById("cost").value.replace(/\D/g,''), 10);

    //Workload
    parsedBoxes.s = parseInt(document.getElementById("s").value.replace(/\D/g,''), 10);
    parsedBoxes.w = parseFloat(document.getElementById("w").value);
    parsedBoxes.r = parseFloat(document.getElementById("r").value);
    parsedBoxes.v = parseFloat(document.getElementById("v").value);
    parsedBoxes.qL = parseFloat(document.getElementById("qL").value);
    parsedBoxes.qS = parseFloat(document.getElementById("qS").value);

    parsedBoxes.read_latency = parseFloat(document.getElementById("read-latency").value);
    parsedBoxes.write_latency = parseFloat(document.getElementById("write-latency").value);

    return parsedBoxes;
}

function navigateDesignSpace() {
    var Variables = parseInputVariables();
    var N = Variables.N;
    var E = Variables.E;
    var F = Variables.F;
    var B = Math.floor(Variables.B/E);
    var s = Variables.s;

    var w = Variables.w;
    var r = Variables.r;
    var v = Variables.v;
    var qL = Variables.qL;
    var qS = Variables.qS;
    var scenario = 'W';//Variables.scenario;

    var read_latency = Variables.read_latency;
    var write_latency = Variables.write_latency;

    var X;
    var Y;
    var L;
    var M_F_HI;
    var M_F; // = ((B*E + (M - M_F)) > 0 ? B*E + (M - M_F) : (B*E)); // byte
    var M_F_LO; // = (M_B*(F)*T)/((B)*(E));
    var M_BF;
    var M_FP;
    var FPR_sum;



    setPricesBasedOnScheme(Variables);
    if(!setMaxRAMNeeded(Variables))
        return;

    var best_cost=-1;

    for (var T = 2; T <= 5; T++) {
        for (var K = 1; K <= T - 1; K++) {
            for (var Z = 1; Z <= T - 1; Z++) {
                for (var M_B_percent = 0.2; M_B_percent < 1; M_B_percent += 0.2) {
                    var M_B = M_B_percent * max_RAM_purchased*1024*1024*1024;
                    var M=max_RAM_purchased*1024*1024*1024;
                    X = Math.max(Math.pow(1 / Math.log(2), 2) * (Math.log(T) / 1 / (T - 1) + Math.log(K / Z)  / T) * 8);
                    M_F_HI = N * ((X / 8) / T + F / B);
                    if ((N / B) < (M_B * T / (B * E))) {
                        M_F_LO = (N / B) * F;
                    } else {
                        M_F_LO = (M_B * F * T) / (B * E);
                    }
                    M_F = M - M_B;
                    if (M_F < M_F_LO)
                        M_F = M_F_LO;
                    L = Math.ceil(Math.log(N * (E) / (M_B)) / Math.log(T));

                    if (M_F >= M_F_HI) {
                        Y = 0;
                        M_FP = N * F / B;
                    } else if (M_F > M_F_LO && M_F < M_F_HI) {
                        Y = L - 1;
                        M_FP = M_F_LO;
                        for (var i = L - 2; i >= 1; i--) {
                            var h = L - i;
                            var temp_M_FP = M_F_LO;
                            for (var j = 2; j <= h; j++) {
                                temp_M_FP = temp_M_FP + (temp_M_FP * T);
                            }
                            if (temp_M_FP <= M_F) {
                                Y = i;
                                M_FP = temp_M_FP;
                            }
                        }
                    } else {
                        Y = L - 1;
                        M_FP = M_F_LO;
                    }
                    M_BF = 0;
                    var margin = 2;
                    if (M_F - M_FP > 0)
                        M_BF = M_F - M_FP - margin;
                    else
                        M_BF = 0.0;


                    var update_cost;
                    var read_cost;
                    var no_result_read_cost;
                    var short_scan_cost;
                    var long_scan_cost;
                    var FPR_sum;

                    if (write_percentage != 0) {
                        update_cost = analyzeUpdateCost(B, T, K, Z, L, Y, M, M_F, M_B, M_F_HI, M_F_LO);
                    }
                    if (read_percentage != 0) {
                        if (scenario == 'A') // Avg-case
                        {
                            //read_cost=analyzeReadCostAvgCase(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                        } else // Worst-case
                        {
                            read_cost = analyzeReadCost(B, E, N, T, K, Z, L, Y, M, M_B, M_F, M_BF, FPR_sum);
                            FPR_sum = Math.exp((-M_BF*8/N)*Math.pow(Math.log(2)/Math.log(2.7182),2)*Math.pow(T, Y)) * Math.pow(Z, (T-1)/T) * Math.pow(K, 1/T) * Math.pow(T, (T/(T-1)))/(T-1);
                            //logReadCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, read_cost, "");
                        }

                    }
                    if (short_scan_percentage != 0) {
                        short_scan_cost = analyzeShortScanCost(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                    }
                    long_scan_cost = analyzeLongScanCost(B, s);
                    if (scenario == 'A') // Avg-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, avg_read_cost, short_scan_cost, long_scan_cost);
                    } else // Worst-case
                    {
                        logTotalCost(T, K, Z, L, Y, M/(1024*1024*1024), M_B/(1024*1024*1024), M_F/(1024*1024*1024), M_F_HI/(1024*1024*1024), M_F_LO/(1024*1024*1024), M_FP/(1024*1024*1024), M_BF/(1024*1024*1024), FPR_sum, update_cost, read_cost, short_scan_cost, long_scan_cost);
                        //logTotalCostSortByUpdateCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, update_cost, read_cost, "");
                        //console.log(Math.pow(K, 1/T));
                    }
                    var total_cost=(w*update_cost*write_latency+v*read_cost*read_latency)/(v+w);
                    if(best_cost<0||best_cost>total_cost){
                        best_cost=total_cost;
                        Variables.K=K;
                        Variables.T=T;
                        Variables.L=L;
                        Variables.Z=Z;
                        Variables.Buffer=M_B;
                        Variables.M_BF=M_BF;
                        Variables.read_cost=read_cost;
                        Variables.update_cost=update_cost;
                        Variables.short_scan_cost=short_scan_cost;
                        Variables.long_scan_cost=long_scan_cost;
                        Variables.no_result_read_cost=read_cost-1;
                        Variables.total_cost=total_cost;
                    }
                }
            }
        }
    }

    var cost_array = [
        Variables.update_cost,
        Variables.long_scan_cost,
        Variables.read_cost,
        Variables.no_result_read_cost,
        max_RAM_purchased*1024*1024*1024,
        0
    ]

    var id_array = [
        "write",
        "long_range_lookup",
        "existing_point_lookup",
        "zero_result_lookup",
        "memory",
        "storage"
    ]
    var text_array = [
        "Update",
        "Range Lookup",
        "Existing Point Lookup",
        "Zero-result Point Lookup",
        //"Space Amplification"
        "Memory",
        "Storage"
    ];

    for(j=0;j <= 4;j++){
        var div_tmp = document.getElementById(id_array[j]);
        removeAllChildren(div_tmp);
        div_tmp.setAttribute("style","text-align: center")
        var p_tmp=document.createElement("p");
        var span_tmp=document.createElement("span");

        var cost = parseFloat(cost_array[j]);
        var threshold_flag=false;
        var message;
        var msg_cost = cost;
        if(cost*1000%1 != 0){
            msg_cost=cost.toExponential(5);
        }
        if(cost > 2000){
            cost = cost.toExponential(2);
        }else if(cost <= 1e-9){
            if(cost != 0){
                threshold_flag=true;
            }
            cost = 0.0;
        }else if(typeof cost == 'number'  && cost*1000 < 1){
            cost = myFloor(cost, 1).toExponential(1)
        }else if(cost*1000%1 != 0){
            cost = (Math.round(cost*1000)/1000).toFixed(3)
        }


        if(j < 4){
            message = text_array[j] + " at this level has " + msg_cost + " I/O cost(s)."
            cost += " I/O";
        }else{
            message = text_array[j] + " of this data structure is " + formatBytes(msg_cost,1) + ".";
            cost = formatBytes(msg_cost/8,1);
        }

        if(threshold_flag){
            message += "Because the value here is too small (less than 1e-9), it is noted as 0 in breakdown table. "
        }

        span_tmp.setAttribute("data-tooltip",message);
        span_tmp.setAttribute("data-tooltip-position","bottom")
        if(j != 4){
            p_tmp.setAttribute("style","text-align: center;font-size:18px")
        }else{
            p_tmp.setAttribute("style","text-align: center;font-weight:bold;font-size:18px");
        }

        p_tmp.textContent=cost
        span_tmp.appendChild(p_tmp);
        div_tmp.appendChild(span_tmp);
    }

    var omega=1e-6;
    var throughput = 1/Variables.total_cost/omega;
    if(throughput > Math.pow(10, 8)){
        message=throughput.toExponential(2) + " ops/s";
        message2="Under the specified workload, the throughout is " + throughput.toExponential(6) + " ops/second"
    }else{
        message= throughput.toFixed(1) + " ops/s";
        message2="Under the specified workload, the throughout is " + throughput.toFixed(6) + " ops/second"
    }
    var div_throughput = document.getElementById("throughput");
    removeAllChildren(div_throughput);
    var span_tmp=document.createElement("span");
    var p_tmp = document.createElement("p");
    p_tmp.textContent = message;
    span_tmp.setAttribute("data-tooltip",message2);
    span_tmp.setAttribute("data-tooltip-position","bottom")
    p_tmp.setAttribute("style","text-align: center;font-weight:bold;font-size:18px")
    span_tmp.appendChild(p_tmp);
    div_throughput.appendChild(span_tmp);

    document.getElementById("mbuffer").value=Variables.Buffer/1024/1024; //in MB
    document.getElementById("memory_budget").value=Variables.M_BF/Variables.N; //0 bits per element
    document.getElementById("L").value=Variables.L;
    document.getElementById("K").value=Variables.K;
    document.getElementById("Z").value=Variables.Z;
    document.getElementById("T").value=Variables.T;

}

function countThroughput(cost, cloud_provider) {
    var Variables = parseInputVariables();
    var N = Variables.N;
    var E = Variables.E;
    var F = Variables.F;
    var B = Math.floor(Variables.B/E);
    var s = Variables.s;

    var w = Variables.w;
    var r = Variables.r;
    var v = Variables.v;
    var qL = Variables.qL;
    var qS = Variables.qS;
    var scenario = 'W';//Variables.scenario;

    var read_latency = Variables.read_latency;
    var write_latency = Variables.write_latency;

    Variables.cost=cost;

    var X;
    var Y;
    var L;
    var M_F_HI;
    var M_F; // = ((B*E + (M - M_F)) > 0 ? B*E + (M - M_F) : (B*E)); // byte
    var M_F_LO; // = (M_B*(F)*T)/((B)*(E));
    var M_BF;
    var M_FP;
    var FPR_sum;

    setPricesBasedOnScheme(Variables, cloud_provider);
    if(!setMaxRAMNeeded(Variables))
        return 0;

    var best_cost=-1;

    for (var T = 2; T <= 8; T++) {
        for (var K = 1; K <= T - 1; K++) {
            for (var Z = 1; Z <= T - 1; Z++) {
                for (var M_B_percent = 0.2; M_B_percent < 1; M_B_percent += 0.2) {
                    var M_B = M_B_percent * max_RAM_purchased*1024*1024*1024;
                    var M=max_RAM_purchased*1024*1024*1024;
                    X = Math.max(Math.pow(1 / Math.log(2), 2) * (Math.log(T) / 1 / (T - 1) + Math.log(K / Z)  / T) * 8);
                    M_F_HI = N * ((X / 8) / T + F / B);
                    if ((N / B) < (M_B * T / (B * E))) {
                        M_F_LO = (N / B) * F;
                    } else {
                        M_F_LO = (M_B * F * T) / (B * E);
                    }
                    M_F = M - M_B;
                    if (M_F < M_F_LO)
                        M_F = M_F_LO;
                    L = Math.ceil(Math.log(N * (E) / (M_B)) / Math.log(T));

                    if (M_F >= M_F_HI) {
                        Y = 0;
                        M_FP = N * F / B;
                    } else if (M_F > M_F_LO && M_F < M_F_HI) {
                        Y = L - 1;
                        M_FP = M_F_LO;
                        for (var i = L - 2; i >= 1; i--) {
                            var h = L - i;
                            var temp_M_FP = M_F_LO;
                            for (var j = 2; j <= h; j++) {
                                temp_M_FP = temp_M_FP + (temp_M_FP * T);
                            }
                            if (temp_M_FP <= M_F) {
                                Y = i;
                                M_FP = temp_M_FP;
                            }
                        }
                    } else {
                        Y = L - 1;
                        M_FP = M_F_LO;
                    }
                    M_BF = 0;
                    var margin = 2;
                    if (M_F - M_FP > 0)
                        M_BF = M_F - M_FP - margin;
                    else
                        M_BF = 0.0;


                    var update_cost;
                    var read_cost;
                    var no_result_read_cost;
                    var short_scan_cost;
                    var long_scan_cost;
                    var FPR_sum;

                    if (write_percentage != 0) {
                        update_cost = analyzeUpdateCost(B, T, K, Z, L, Y, M, M_F, M_B, M_F_HI, M_F_LO);
                    }
                    if (read_percentage != 0) {
                        if (scenario == 'A') // Avg-case
                        {
                            //read_cost=analyzeReadCostAvgCase(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                        } else // Worst-case
                        {
                            read_cost = analyzeReadCost(B, E, N, T, K, Z, L, Y, M, M_B, M_F, M_BF, FPR_sum);
                            FPR_sum = Math.exp((-M_BF*8/N)*Math.pow(Math.log(2)/Math.log(2.7182),2)*Math.pow(T, Y)) * Math.pow(Z, (T-1)/T) * Math.pow(K, 1/T) * Math.pow(T, (T/(T-1)))/(T-1);
                            //logReadCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, read_cost, "");
                        }

                    }
                    if (short_scan_percentage != 0) {
                        short_scan_cost = analyzeShortScanCost(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                    }
                    long_scan_cost = analyzeLongScanCost(B, s);
                    if (scenario == 'A') // Avg-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, avg_read_cost, short_scan_cost, long_scan_cost);
                    } else // Worst-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M/(1024*1024*1024), M_B/(1024*1024*1024), M_F/(1024*1024*1024), M_F_HI/(1024*1024*1024), M_F_LO/(1024*1024*1024), M_FP/(1024*1024*1024), M_BF/(1024*1024*1024), FPR_sum, update_cost, read_cost, short_scan_cost, long_scan_cost);
                        //logTotalCostSortByUpdateCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, update_cost, read_cost, "");
                    }
                    var total_cost=(w*update_cost*write_latency+v*read_cost*read_latency)/(v+w);
                    if(best_cost<0||best_cost>total_cost){
                        best_cost=total_cost;
                        Variables.K=K;
                        Variables.T=T;
                        Variables.L=L;
                        Variables.Z=Z;
                        Variables.Buffer=M_B;
                        Variables.M_BF=M_BF;
                        Variables.read_cost=read_cost;
                        Variables.update_cost=update_cost;
                        Variables.short_scan_cost=short_scan_cost;
                        Variables.long_scan_cost=long_scan_cost;
                        Variables.no_result_read_cost=read_cost-1;
                        Variables.total_cost=total_cost;
                    }
                }
            }
        }
    }
    T1=Variables.T;
    K1=Variables.K;
    Z1=Variables.Z;
    L1=Variables.L;
    //return  max_RAM_purchased;
    return 1000000/best_cost;
}

function countThroughputByLatency(read_latency, write_latency) {
    var Variables = parseInputVariables();
    var N = Variables.N;
    var E = Variables.E;
    var F = Variables.F;
    var B = Math.floor(Variables.B/E);
    var s = Variables.s;

    var w = Variables.w;
    var r = Variables.r;
    var v = Variables.v;
    var qL = Variables.qL;
    var qS = Variables.qS;
    var scenario = 'W';//Variables.scenario;

    var X;
    var Y;
    var L;
    var M_F_HI;
    var M_F; // = ((B*E + (M - M_F)) > 0 ? B*E + (M - M_F) : (B*E)); // byte
    var M_F_LO; // = (M_B*(F)*T)/((B)*(E));
    var M_BF;
    var M_FP;
    var FPR_sum;

    setPricesBasedOnScheme(Variables);
    if(!setMaxRAMNeeded(Variables))
        return 0;

    var best_cost=-1;

    for (var T = 2; T <= 8; T++) {
        for (var K = 1; K <= T - 1; K++) {
            for (var Z = 1; Z <= T - 1; Z++) {
                for (var M_B_percent = 0.2; M_B_percent < 1; M_B_percent += 0.2) {
                    var M_B = M_B_percent * max_RAM_purchased*1024*1024*1024;
                    var M=max_RAM_purchased*1024*1024*1024;
                    X = Math.max(Math.pow(1 / Math.log(2), 2) * (Math.log(T) / 1 / (T - 1) + Math.log(K / Z)  / T) * 8);
                    M_F_HI = N * ((X / 8) / T + F / B);
                    if ((N / B) < (M_B * T / (B * E))) {
                        M_F_LO = (N / B) * F;
                    } else {
                        M_F_LO = (M_B * F * T) / (B * E);
                    }
                    M_F = M - M_B;
                    if (M_F < M_F_LO)
                        M_F = M_F_LO;
                    L = Math.ceil(Math.log(N * (E) / (M_B)) / Math.log(T));

                    if (M_F >= M_F_HI) {
                        Y = 0;
                        M_FP = N * F / B;
                    } else if (M_F > M_F_LO && M_F < M_F_HI) {
                        Y = L - 1;
                        M_FP = M_F_LO;
                        for (var i = L - 2; i >= 1; i--) {
                            var h = L - i;
                            var temp_M_FP = M_F_LO;
                            for (var j = 2; j <= h; j++) {
                                temp_M_FP = temp_M_FP + (temp_M_FP * T);
                            }
                            if (temp_M_FP <= M_F) {
                                Y = i;
                                M_FP = temp_M_FP;
                            }
                        }
                    } else {
                        Y = L - 1;
                        M_FP = M_F_LO;
                    }
                    M_BF = 0;
                    var margin = 2;
                    if (M_F - M_FP > 0)
                        M_BF = M_F - M_FP - margin;
                    else
                        M_BF = 0.0;


                    var update_cost;
                    var read_cost;
                    var no_result_read_cost;
                    var short_scan_cost;
                    var long_scan_cost;
                    var FPR_sum;

                    if (write_percentage != 0) {
                        update_cost = analyzeUpdateCost(B, T, K, Z, L, Y, M, M_F, M_B, M_F_HI, M_F_LO);
                    }
                    if (read_percentage != 0) {
                        if (scenario == 'A') // Avg-case
                        {
                            //read_cost=analyzeReadCostAvgCase(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                        } else // Worst-case
                        {
                            read_cost = analyzeReadCost(B, E, N, T, K, Z, L, Y, M, M_B, M_F, M_BF, FPR_sum);
                            FPR_sum = Math.exp((-M_BF*8/N)*Math.pow(Math.log(2)/Math.log(2.7182),2)*Math.pow(T, Y)) * Math.pow(Z, (T-1)/T) * Math.pow(K, 1/T) * Math.pow(T, (T/(T-1)))/(T-1);
                            //logReadCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, read_cost, "");
                        }

                    }
                    if (short_scan_percentage != 0) {
                        short_scan_cost = analyzeShortScanCost(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                    }
                    long_scan_cost = analyzeLongScanCost(B, s);
                    if (scenario == 'A') // Avg-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, avg_read_cost, short_scan_cost, long_scan_cost);
                    } else // Worst-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M/(1024*1024*1024), M_B/(1024*1024*1024), M_F/(1024*1024*1024), M_F_HI/(1024*1024*1024), M_F_LO/(1024*1024*1024), M_FP/(1024*1024*1024), M_BF/(1024*1024*1024), FPR_sum, update_cost, read_cost, short_scan_cost, long_scan_cost);
                        //logTotalCostSortByUpdateCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, update_cost, read_cost, "");
                    }
                    var total_cost=(w*update_cost*write_latency+v*read_cost*read_latency)/(v+w);
                    if(best_cost<0||best_cost>total_cost){
                        best_cost=total_cost;
                        Variables.K=K;
                        Variables.T=T;
                        Variables.L=L;
                        Variables.Z=Z;
                        Variables.Buffer=M_B;
                        Variables.M_BF=M_BF;
                        Variables.read_cost=read_cost;
                        Variables.update_cost=update_cost;
                        Variables.short_scan_cost=short_scan_cost;
                        Variables.long_scan_cost=long_scan_cost;
                        Variables.no_result_read_cost=read_cost-1;
                        Variables.total_cost=total_cost;
                    }
                }
            }
        }
    }
    //T1=Variables.T;
    //K1=Variables.K;
    //Z1=Variables.Z;
    //return  max_RAM_purchased;
    return 1000000/best_cost;
}

function countThroughputByBlockSize(BlockSize) {
    var Variables = parseInputVariables();
    var N = Variables.N;
    var E = Variables.E;
    var F = Variables.F;
    var B = Math.floor(BlockSize/E);
    var s = Variables.s;

    var w = Variables.w;
    var r = Variables.r;
    var v = Variables.v;
    var qL = Variables.qL;
    var qS = Variables.qS;
    var scenario = 'W';//Variables.scenario;

    var read_latency = Variables.read_latency;
    var write_latency = Variables.write_latency;


    var X;
    var Y;
    var L;
    var M_F_HI;
    var M_F; // = ((B*E + (M - M_F)) > 0 ? B*E + (M - M_F) : (B*E)); // byte
    var M_F_LO; // = (M_B*(F)*T)/((B)*(E));
    var M_BF;
    var M_FP;
    var FPR_sum;

    setPricesBasedOnScheme(Variables);
    if(!setMaxRAMNeeded(Variables))
        return 0;

    var best_cost=-1;

    for (var T = 2; T <= 8; T++) {
        for (var K = 1; K <= T - 1; K++) {
            for (var Z = 1; Z <= T - 1; Z++) {
                for (var M_B_percent = 0.2; M_B_percent < 1; M_B_percent += 0.2) {
                    var M_B = M_B_percent * max_RAM_purchased*1024*1024*1024;
                    var M=max_RAM_purchased*1024*1024*1024;
                    X = Math.max(Math.pow(1 / Math.log(2), 2) * (Math.log(T) / 1 / (T - 1) + Math.log(K / Z)  / T) * 8);
                    M_F_HI = N * ((X / 8) / T + F / B);
                    if ((N / B) < (M_B * T / (B * E))) {
                        M_F_LO = (N / B) * F;
                    } else {
                        M_F_LO = (M_B * F * T) / (B * E);
                    }
                    M_F = M - M_B;
                    if (M_F < M_F_LO)
                        M_F = M_F_LO;
                    L = Math.ceil(Math.log(N * (E) / (M_B)) / Math.log(T));

                    if (M_F >= M_F_HI) {
                        Y = 0;
                        M_FP = N * F / B;
                    } else if (M_F > M_F_LO && M_F < M_F_HI) {
                        Y = L - 1;
                        M_FP = M_F_LO;
                        for (var i = L - 2; i >= 1; i--) {
                            var h = L - i;
                            var temp_M_FP = M_F_LO;
                            for (var j = 2; j <= h; j++) {
                                temp_M_FP = temp_M_FP + (temp_M_FP * T);
                            }
                            if (temp_M_FP <= M_F) {
                                Y = i;
                                M_FP = temp_M_FP;
                            }
                        }
                    } else {
                        Y = L - 1;
                        M_FP = M_F_LO;
                    }
                    M_BF = 0;
                    var margin = 2;
                    if (M_F - M_FP > 0)
                        M_BF = M_F - M_FP - margin;
                    else
                        M_BF = 0.0;


                    var update_cost;
                    var read_cost;
                    var no_result_read_cost;
                    var short_scan_cost;
                    var long_scan_cost;
                    var FPR_sum;

                    if (write_percentage != 0) {
                        update_cost = analyzeUpdateCost(B, T, K, Z, L, Y, M, M_F, M_B, M_F_HI, M_F_LO);
                    }
                    if (read_percentage != 0) {
                        if (scenario == 'A') // Avg-case
                        {
                            //read_cost=analyzeReadCostAvgCase(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                        } else // Worst-case
                        {
                            read_cost = analyzeReadCost(B, E, N, T, K, Z, L, Y, M, M_B, M_F, M_BF, FPR_sum);
                            FPR_sum = Math.exp((-M_BF*8/N)*Math.pow(Math.log(2)/Math.log(2.7182),2)*Math.pow(T, Y)) * Math.pow(Z, (T-1)/T) * Math.pow(K, 1/T) * Math.pow(T, (T/(T-1)))/(T-1);
                            //logReadCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, read_cost, "");
                        }

                    }
                    if (short_scan_percentage != 0) {
                        short_scan_cost = analyzeShortScanCost(B, T, K, Z, L, Y, M, M_B, M_F, M_BF);
                    }
                    long_scan_cost = analyzeLongScanCost(B, s);
                    if (scenario == 'A') // Avg-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, avg_read_cost, short_scan_cost, long_scan_cost);
                    } else // Worst-case
                    {
                        //logTotalCost(T, K, Z, L, Y, M/(1024*1024*1024), M_B/(1024*1024*1024), M_F/(1024*1024*1024), M_F_HI/(1024*1024*1024), M_F_LO/(1024*1024*1024), M_FP/(1024*1024*1024), M_BF/(1024*1024*1024), FPR_sum, update_cost, read_cost, short_scan_cost, long_scan_cost);
                        //logTotalCostSortByUpdateCost(d_list, T, K, 0, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, update_cost, read_cost, "");
                    }
                    var total_cost=(w*update_cost*write_latency+v*read_cost*read_latency)/(v+w);
                    if(best_cost<0||best_cost>total_cost){
                        best_cost=total_cost;
                        Variables.K=K;
                        Variables.T=T;
                        Variables.L=L;
                        Variables.Z=Z;
                        Variables.Buffer=M_B;
                        Variables.M_BF=M_BF;
                        Variables.read_cost=read_cost;
                        Variables.update_cost=update_cost;
                        Variables.short_scan_cost=short_scan_cost;
                        Variables.long_scan_cost=long_scan_cost;
                        Variables.no_result_read_cost=read_cost-1;
                        Variables.total_cost=total_cost;
                    }
                }
            }
        }
    }
    T1=Variables.T;
    K1=Variables.K;
    Z1=Variables.Z;
    L1=Variables.L;
    //return  max_RAM_purchased;
    return 1000000/best_cost;
}

function analyzeUpdateCost(B, T, K, Z, L, Y, M, M_F, M_B, M_F_HI, M_F_LO) {
    var update_cost;
    if (Y == 0) {
        update_cost = (((T * (L - 1)) / K) + (T / Z)) / B;
    } else {
        update_cost = (((T * (L - Y - 1)) / K) + (T / Z) * (Y + 1)) / B;
    }
    return update_cost;
}


function analyzeReadCost(B, E, N, T, K, Z, L, Y, M, M_B, M_F, M_BF, FPR_sum){
    var entries_in_hot_level;
    var first = T*(M_B/E);
    var sum = first;
    for(var i = 2;i<=L-Y;i++)
    {
        sum = sum + first*Math.pow(T, i-1);
    }
    entries_in_hot_level = sum;
    var bits_per_entry = M_BF*8/entries_in_hot_level;
    FPR_sum = Math.exp(((-M_BF*8)/N)*Math.pow(Math.log(2),2)*Math.pow(T, Y)) * Math.pow(Z, (T-1)/T) * Math.pow(K, 1/T) * Math.pow(T, (T/(T-1)))/(T-1);
    //*FPR_sum = exp((-M_BF*8/N)*(2*log(2)/log(2.7182))*pow(T, Y)) * pow(Z, (T-1)/T) * pow(K, 1/T) * pow(T, (T/(T-1)))/(T-1);
    //console.log(Math.pow(K, 1/T));
    return (1.0 + (Y*Z) + FPR_sum);
}

function analyzeShortScanCost(B, T, K, Z, L, Y, M, M_B, M_F, M_BF){
    if(Y == 0)
    {
        return short_scan_cost = K*L;
    }
    else
    {
        return short_scan_cost = K*(L-Y-1) + Z*(Y+1);
    }
}

function analyzeLongScanCost(s,B) {
    return s/B;
}

function logTotalCost(T, K, Z, L, Y, M, M_B, M_F, M_F_HI, M_F_LO, M_FP, M_BF, FPR_sum, update_cost, read_cost, short_scan_cost, long_scan_cost){
    console.log("T="+T+",K="+K+",Z="+Z+",L="+L+",Y="+Y+",M="+M+",M_B="+M_B+",M_F="+M_F+",M_F_HI="+M_F_HI+",M_F_LO="+M_F_LO+",M_FP="+M_FP+",M_BF="+M_BF+",FPR_sum="+FPR_sum+",update_cost="+update_cost+",read_cost="+read_cost+",short_scan_cost="+short_scan_cost+",long_scan_cost="+long_scan_cost);
}


function setPricesBasedOnScheme(Variables, cloud_provider)
{
    total_budget = Variables.cost; //generateRandomBudget(MIN_BUDGET, MAX_BUDGET); for a month
    var storage, MBps, monthly_storage_cost;
    storage = (Variables.N*Variables.E)/(1024*1024*1024);
    if(cloud_provider==undefined) {
        cloud_provider = getCloudProvider("cloud_provider");
    }
    var B;
    if(cloud_provider == 1)
    {
        MIN_RAM_SIZE = 16; // GB
        RAM_BLOCK_COST = 0.091; // per RAM block per hour
        MBps = 3500; // it is actually Mbps  for AWS
        B = Math.floor(4096/Variables.E); //https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/memory-optimized-instances.html
        IOPS = MBps*Math.pow(10,6)/(B*Variables.E);
        if(IOPS > 15000)
        {
            IOPS = 15000;
        }
        if(storage > 75)
        {
            monthly_storage_cost = (storage-75)*0.1; // $0.1 per GB-month https://aws.amazon.com/ebs/pricing/
            total_budget = total_budget - monthly_storage_cost;
        }
        network_bandwidth = 10.0*1024*1024*1024/8; //Gbps
    }
    if(cloud_provider == 0)
    {
        MIN_RAM_SIZE = 13; // GB
        RAM_BLOCK_COST = 0.0745; // per RAM block per hour
        MBps = read_percentage*720/100 + write_percentage*160/100; // taking average
        B = 16*1024/(Variables.E);
        IOPS = MBps*Math.pow(10,6)/(B*Variables.E);
        if(IOPS > 30000)
        {
            IOPS = 30000;
        }
        monthly_storage_cost = storage*0.24;
        total_budget = total_budget - monthly_storage_cost;
    }
    if(cloud_provider == 2)
    {
        MIN_RAM_SIZE = 16; // GB
        RAM_BLOCK_COST = 0.0782; // per RAM block per hour
        B = 8*1024/(Variables.E);
        if(storage <= 32)
        {
            IOPS = 120;
            monthly_storage_cost = 5.28;
        }
        else if(storage > 32 && storage <= 64)
        {
            IOPS = 240;
            monthly_storage_cost = 10.21;
        }
        else if(storage > 64 && storage <= 128)
        {
            IOPS = 500;
            monthly_storage_cost = 19.71;
        }
        else if(storage > 128 && storage <= 256)
        {
            IOPS = 1100;
            monthly_storage_cost = 38.02;
        }
        else if(storage > 256 && storage <= 512)
        {
            IOPS = 2300;
            monthly_storage_cost = 73.22;
        }
        else if(storage > 512 && storage <= 2000)
        {
            IOPS = 5000;
            monthly_storage_cost = 135.17;
        }
        else
        {
            IOPS = 7500;
            monthly_storage_cost = 259.05;
        }
        total_budget = total_budget - monthly_storage_cost;
    }

    //console.log(cloud_provider+"====="+total_budget)
}

function setMaxRAMNeeded(Variables)
{
    if(total_budget <= 0)
    {
        console.log("\n************ INSUFFICIENT BUDGET FOR PRICING SCHEME *************\n");
        return 0;
    }
    //int i=0;
    var max_RAM_blocks = /*Math.floor*/((total_budget/(24*30*(RAM_BLOCK_COST))));
    if(max_RAM_blocks < 0)
    {
        console.log("\n************ INSUFFICIENT BUDGET FOR PRICING SCHEME *************\n");
        return 0;
    }
    var max_RAM_needed = ((Variables.N*Variables.E)/(1024.0*1024*1024)); // in GB
    if(MIN_RAM_SIZE*max_RAM_blocks <= max_RAM_needed) // what I can purchase is less than or equal to what I need
    {
        max_RAM_purchased = MIN_RAM_SIZE*max_RAM_blocks;
    }
    else // what I can purchase is more than what I need
    {
        max_RAM_purchased = Math.ceil(max_RAM_needed/MIN_RAM_SIZE)*MIN_RAM_SIZE;
    }
    //printf("\nmax_RAM_needed:%f \tmax_RAM_purchased:%f", max_RAM_needed, max_RAM_purchased);
    return 1;
}

function getCloudProvider(buttonName){
    var lsm_map = {
        "GCP":0,
        "AWS":1,
        "Azure":2
    }
    var buttons = document.getElementsByName(buttonName);
    var val;
    for(var i = 0; i < buttons.length; i++){
        if(buttons[i].style.fontWeight=='bold'){
            val = lsm_map[buttons[i].id];
        }
    }
    return parseInt(val);
}