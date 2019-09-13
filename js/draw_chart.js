

var colors=[
    'green',
    'steelblue',
    'crimson'
];

var cloud_array=[
    'AWS',
    'GCP',
    'AZURE'
];

function Chart(){
    var data;
    var layout;
    var provider_num_array;
}


function pushProviderResults(GCP,GCP_x,AWS,AWS_x,Azure,Azure_x,data1,best_provider,current_y,current_x,hoverInfo){
    console.log(hoverInfo);
    if(best_provider==0){
        GCP_x.push(current_x);
        GCP.push(current_y);
        var GCPPoint={
            x: GCP_x,
            y: GCP,
            marker: { size: 7, symbol: 'circle', color: 'steelblue'},
            name: 'GCP',
            mode: 'lines',
            type: 'scatter',
            text: hoverInfo,
            showlegend: false,
            hovertemplate:
                "<b>%{text}</b><br><br>",
            legendgroup: 'GCP'
        }
        data1.push(GCPPoint);
        GCP_x=new Array();
        GCP=new Array();
    }
    if(best_provider==1){
        AWS_x.push(current_x);
        AWS.push(current_y);
        var AWSPoint={
            x: AWS_x,
            y: AWS,
            marker: { size: 7, symbol: 'circle', color: 'green'},
            name: 'AWS',
            mode: 'lines',
            text: hoverInfo,
            showlegend: false,
            hovertemplate:
                "<b>%{text}</b><br><br>",
            type: 'scatter'
        }
        data1.push(AWSPoint);
        AWS_x=new Array();
        AWS=new Array();
    }
    if(best_provider==2){
        Azure_x.push(current_x);
        Azure.push(current_y);
        var AzurePoint={
            x: Azure_x,
            y: Azure,
            marker: { size: 7, symbol: 'circle', color: 'orange'},
            name: 'Azure',
            mode: 'lines',
            text: hoverInfo,
            showlegend: false,
            hovertemplate:
                "<b>%{text}</b><br><br>",
            type: 'scatter'
        }
        data1.push(AzurePoint);
        Azure_x=new Array();
        Azure=new Array();
    }
}

function drawCharts() {
    var Cost=new Array();
    var GCP=new Array();
    var AWS=new Array();
    var Azure=new Array();

    var Azure_x=new Array();
    var GCP_x=new Array();
    var AWS_x=new Array();


    var x=new Array();
    var y=new Array();

    var hoverInfo=new Array();

    var derivative=new Array();

    var data1=[];

    var cost=parseInt(document.getElementById("cost").value.replace(/\D/g,''), 10);
    console.log(cost);

    var best_provider=2;
    var best_provider_now=2;
    var step_width=5;
    var last_throughput=0;
    for(var i=0;i<cost*2;i+=step_width){
        var best_design;
        //console.log(i);
        x.push(i);
        y.push(countThroughput(i));

        var temp_throughput=last_throughput;
        //GCP.push(countThroughput(i,0));
        //AWS.push(countThroughput(i,1));
        //Azure.push(countThroughput(i,2));

        var gcp_design=countThroughput(i,0);
        var aws_design=countThroughput(i,1);
        var azure_design=countThroughput(i,2);
        var gcp=100000/gcp_design.total_cost;
        var aws=100000/aws_design.total_cost;
        var azure=100000/azure_design.total_cost;
        var maxThroughput;


        if(gcp>aws&&gcp>azure) {
            best_provider_now=0;
            GCP.push(gcp);
            GCP_x.push(i);
            maxThroughput=gcp;
            best_design=gcp_design;
            derivative.push((gcp-last_throughput)/step_width);
            last_throughput=gcp;
        }else if(aws>azure){
            best_provider_now=1;
            AWS.push(aws);
            AWS_x.push(i);
            maxThroughput=aws;
            best_design=aws_design;
            derivative.push((aws-last_throughput)/step_width);
            last_throughput=aws;
        }else{
            best_provider_now=2;
            Azure.push(azure);
            Azure_x.push(i);
            maxThroughput=azure;
            best_design=azure_design;
            derivative.push((azure-last_throughput)/step_width);
            last_throughput=azure;
        }
        hoverInfo.push("T="+best_design.T+" K="+best_design.K+" Z="+best_design.Z+" L="+best_design.L +" Buffer size="+(best_design.Buffer/1024/1024/1024).toFixed(2)+"GB M_BF="+(best_design.M_BF/1024/1024/1024).toFixed(2)+"GB M_FP="+(best_design.M_FP/1024/1024/1024).toFixed(2)+"GB");
        if(best_provider_now!=best_provider){
            pushProviderResults(GCP,GCP_x,AWS,AWS_x,Azure,Azure_x,data1,best_provider,maxThroughput,i,hoverInfo);
            if (best_provider==0) {
                GCP = new Array();
                GCP_x = new Array();
            }else if(best_provider==1){
                AWS = new Array();
                AWS_x=new Array();
            }else {
                Azure_x = new Array();
                Azure = new Array();
            }

            if (i>0) {
                if (best_provider_now == 0) {
                    GCP.push(temp_throughput);
                    GCP_x.push(i - 1);
                } else if (best_provider_now == 1) {
                    AWS.push(temp_throughput);
                    AWS_x.push(i - 1);
                } else {
                    Azure.push(temp_throughput);
                    Azure_x.push(i - 1);
                }
            }


            hoverInfo=new Array();
            hoverInfo.push("T="+best_design.T+" K="+best_design.K+" Z="+best_design.Z+" L="+best_design.L +" Buffer size="+(best_design.Buffer/1024/1024/1024).toFixed(2)+"GB M_BF="+(best_design.M_BF/1024/1024/1024).toFixed(2)+"GB M_FP="+(best_design.M_FP/1024/1024/1024).toFixed(2)+"GB");
        }
        best_provider=best_provider_now;

    }

    pushProviderResults(GCP,GCP_x,AWS,AWS_x,Azure,Azure_x,data1,best_provider,maxThroughput,i,hoverInfo);
    GCP=new Array();
    AWS=new Array();
    Azure=new Array();

    Azure_x=new Array();
    GCP_x=new Array();
    AWS_x=new Array();

    console.log(x);
    var trace = {
        x: x,
        y: derivative,
        type: 'scatter'
    };

    var GCPPoint={
        x: GCP_x,
        y: GCP,
        marker: { size: 7, symbol: 'circle', color: 'steelblue'},
        name: 'GCP',
        //mode: 'markers',
        hovertemplate:
            "<b>%{text}</b><br><br>",
        type: 'scatter'
    }

    var AWSPoint={
        x: AWS_x,
        y: AWS,
        marker: { size: 7, symbol: 'circle', color: 'green'},
        name: 'AWS',
        //mode: 'markers',
        hovertemplate:
            "<b>%{text}</b><br><br>",
        type: 'scatter'
    }

    var AzurePoint={
        x: Azure_x,
        y: Azure,
        marker: { size: 7, symbol: 'circle', color: 'orange'},
        name: 'Azure',
        //mode: 'markers',
        hovertemplate:
            "<b>%{text}</b><br><br>",
        type: 'scatter'
    }

    for(var i=0;i<derivative.length;i++){
        if(derivative[i]>15000);
        //derivative[i]=(derivative[i-1]+derivative[i+1]+derivative[i-2]+derivative[i+2])/4;
    }

    var data=[trace];

    var layout =
        {
            xaxis: {
                title: 'Cost',
                range: [ 0, cost*2+100 ]
            },
            yaxis: {
                title: 'Throughput',
            },
            autosize: true,
            width: 600,
            height: 300,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };

    var layout1 =
        {
            xaxis: {
                title: 'Cost',
                range: [ 0, cost*2+100 ]
            },
            yaxis: {
                title: 'Throughput',
                type: 'log',
                autorange: true
            },
            autosize: true,
            width: 600,
            height: 300,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };


    Plotly.newPlot('tester', data, layout1);

    Plotly.newPlot('tester2', data1, layout);

    //Plotly.newPlot('tester3', data, layout);

    var myPlot = document.getElementById('tester2')

    myPlot.on('plotly_hover', function (eventdata){
        var points = eventdata.points[0],
            pointNum = points.x;
        console.log(pointNum);
        Plotly.Fx.hover('tester',[
            { xval :pointNum }
        ]);
    });
}

function drawChart2() {
    var Azure=new Array();
    var GCP=new Array();
    var AWS=new Array();
    var x=new Array();
    var GCP_hover=new Array();
    var AWS_hover=new Array();
    var Azure_hover=new Array();

    var cost=parseInt(document.getElementById("cost").value.replace(/\D/g,''), 10);
    var step_width=500;

    for(var i=0;i<cost*2;i+=step_width){
        var aws_design=countThroughput(i,0);
        var gcp_design=countThroughput(i,1);
        var azure_design=countThroughput(i,2);
        var gcp=gcp_design.latency;
        var aws=aws_design.latency;
        var azure=azure_design.latency;

        x.push(i);
        GCP.push(gcp);
        AWS.push(aws);
        Azure.push(azure);

        GCP_hover.push("T="+gcp_design.T+", K="+gcp_design.K+", Z="+gcp_design.Z+", L="+gcp_design.L +"<br>M_B="+(gcp_design.Buffer/1024/1024/1024).toFixed(2)+" GB, M_BF="+(gcp_design.M_BF/1024/1024/1024).toFixed(2)+" GB,<br>M_FP="+(gcp_design.M_FP/1024/1024/1024).toFixed(2)+" GB, "+gcp_design.VM_info);
        AWS_hover.push("T="+aws_design.T+", K="+aws_design.K+", Z="+aws_design.Z+", L="+aws_design.L +"<br>M_B="+(aws_design.Buffer/1024/1024/1024).toFixed(2)+" GB, M_BF="+(aws_design.M_BF/1024/1024/1024).toFixed(2)+" GB,<br>M_FP="+(aws_design.M_FP/1024/1024/1024).toFixed(2)+" GB"+aws_design.VM_info);
        Azure_hover.push("T="+azure_design.T+", K="+azure_design.K+", Z="+azure_design.Z+", L="+azure_design.L +"<br>M_B="+(azure_design.Buffer/1024/1024/1024).toFixed(2)+" GB, M_BF="+(azure_design.M_BF/1024/1024/1024).toFixed(2)+" GB,<br>M_FP="+(azure_design.M_FP/1024/1024/1024).toFixed(2)+" GB, "+azure_design.VM_info);


    }

    var GCPPoint={
        x: x,
        y: GCP,
        marker: { size: 7, symbol: 'circle', color: 'steelblue'},
        name: 'GCP',
        //mode: 'markers',
        text: GCP_hover,
        hovertemplate:
            "<b>%{x}</b><br><br>",
        type: 'scatter'
    }

    var AWSPoint={
        x: x,
        y: AWS,
        marker: { size: 7, symbol: 'circle', color: 'green'},
        name: 'AWS',
        //mode: 'markers',
        text: AWS_hover,
        hovertemplate:
            "<b>%{x}</b><br><br>",
        type: 'scatter'
    }

    var AzurePoint={
        x: x,
        y: Azure,
        marker: { size: 7, symbol: 'circle', color: 'crimson'},
        name: 'Azure',
        //mode: 'markers',
        text: Azure_hover,
        hovertemplate:
            "<b>%{x}</b><br><br>",
        type: 'scatter'
    }

    var data=[AWSPoint,GCPPoint,AzurePoint];

    var i=0;
    while(Azure[i]==undefined||isNaN(Azure[i]))
        i++;

    var layout1 =
        {
            hoverlable:{opacity: 0.5},
            legend: {
                x: 0.9,
                y: 1
            },
            xaxis: {
                title: 'Cost ($/month)',
                range: [ 0, cost*2+100 ]
            },
            yaxis: {
                title: 'Latency (hour)',
                range: [0, Azure[i]*1.05]
            },
            autosize: true,
            width: 750,
            height: 350,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };

    Plotly.newPlot('tester2', data, layout1);

    //var hoverInfo = document.getElementById('hoverinfo2_aws');
    var myPlot = document.getElementById('tester2');
    myPlot.on('plotly_hover', function(data){
        for(var i in data.points){
            var cloud_provider=data.points[i].data.name;
            if(cloud_provider=='AWS')
                hoverInfo = document.getElementById('hoverinfo2_aws');
            if(cloud_provider=='GCP')
                hoverInfo = document.getElementById('hoverinfo2_gcp');
            if(cloud_provider=='Azure')
                hoverInfo = document.getElementById('hoverinfo2_azure');
            hoverInfo.innerHTML=("<b>"+cloud_provider+":</b><br>"+data.points[i].text);
        }
        //console.log(data);
        //hoverInfo.innerHTML = infotext.join('<br/>');
    })
    //.on('plotly_unhover', function(data){
    //    hoverInfo.innerHTML = '';
    //});
}

function initChart(ContinuumArray, x, y, x_axis_title, y_axis_title, mode){
    var chart=new Chart();
    var result_array=ContinuumArray;
    result_array.sort(function (a,b) {return a[x]-b[x];});
    var result_array_ever=new Array();
    var best_y=-1;
    var provider_num_array=[0,0,0];
    for(var i=0;i<result_array.length;i++){
        if(mode==0) {
            if (best_y == -1 || (best_y - result_array[i][y]) > 0) {
                best_y = result_array[i][y];
                result_array_ever.push(result_array[i]);
            }
        }
        if(mode==1) {
            if (best_y == -1 || (best_y - result_array[i][y]) < 0) {
                best_y = result_array[i][y];
                result_array_ever.push(result_array[i]);
            }
        }
        if(i<result_array.length/10) {
            for (var j = 0; j < 3; j++) {
                if (result_array[i][3] == cloud_array[j]) {
                    provider_num_array[j]++;
                }
            }
        }
    }

    var legend_array=new Array();
    for(var i=0; i<3; i++){
        legend_array[i]={x: [null],
            y: [null],
            marker: { size: 7, symbol: 'circle', color: "crimson"},
            showlegend: true,
            mode: 'markers',
            name: "red",
            type: 'scatter'
        };
        legend_array[i].marker.color=colors[i];
        legend_array[i].name=cloud_array[i];
    }

    var y_array=new Array();
    var x_array=new Array();
    var info_array=new Array();
    var name_array=new Array();
    var color_array_ad=new Array();
    for(var i=0;i<result_array_ever.length;i++){
        x_array.push(result_array_ever[i][x]);
        y_array.push(result_array_ever[i][y]);
        info_array.push(result_array_ever[i][4]);
        name_array.push(result_array_ever[i][3])
        for(var j=0;j<3;j++){
            if(result_array_ever[i][3]==cloud_array[j])
                color_array_ad.push(colors[j]);
        }
    }

    chart.data=[{
        x: x_array,
        y: y_array,
        marker: { size: 7, symbol: 'circle', color: color_array_ad},
        mode: 'lines+markers',
        text: info_array,
        line: {color: 'grey', width: 2},
        showlegend: false,
        hovertext: name_array,
        hovertemplate:
            "<b>%{hovertext}</b><extra></extra>",
        type: 'scatter'
    },legend_array[0],legend_array[1],legend_array[2]];

    chart.layout =
        {
            xaxis: {
                title: x_axis_title,
                autorange: true
            },
            yaxis: {
                title: y_axis_title,
                autorange: true
            },
            legend: {
                "orientation": "h",
                x: 0.1,
                y: 1
            },
            autosize: true,
            hovermode: "closest",
            width: 375,
            height: 300,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };

    chart.provider_num_array=provider_num_array;

    return chart;
}

function drawContinuums() {

    var provider_num_array=[0,0,0];
    var provider_num_array_ad=[0,0,0];

    var legend_array=new Array();
    for(var i=0; i<3; i++){
        legend_array[i]={x: [null],
            y: [null],
            marker: { size: 7, symbol: 'circle', color: "crimson"},
            showlegend: true,
            mode: 'markers',
            name: "red",
            type: 'scatter'
        };
        legend_array[i].marker.color=colors[i];
        legend_array[i].name=cloud_array[i];
    }
   document.getElementById("chart_style").value="1";

    var cost=parseInt(document.getElementById("cost").value.replace(/\D/g,''), 10);

    var cloud_provider=document.getElementById("cloud-provider").selectedIndex;

    var ContinuumArray=buildContinuums(cloud_provider);

    var best_array=ContinuumArray;
    var latency_array=new Array();
    var cost_array=new Array();
    var info_array=new Array();
    for(var i=0;i<best_array.length;i++){
        cost_array.push(best_array[i][0]);
        latency_array.push(best_array[i][1]);
        info_array.push(best_array[i][4]);
        if(i<best_array.length/10){
            for(var j=0;j<3;j++){
                if(best_array[i][3]==cloud_array[j]) {
                    provider_num_array_ad[j]++;
                }
            }
        }
    }
    console.log(info_array);
    var data=[{
        x: cost_array,
        y: latency_array,
        //marker: { size: 7, symbol: 'circle', color: 'steelblue'},
        //mode: 'markers',
        showlegend: false,
        text: info_array,
        //line: {width: 2, color:'lightblue'},
        hovertemplate:
            "<b>%{text}</b><br><br>",
        type: 'scatter'
    }];

    best_array=getBestDesignEverArray(ContinuumArray);
    latency_array=new Array();
    cost_array=new Array();
    info_array=new Array();
    var name_array=new Array();
    var color_array=new Array();
    for(var i=0;i<best_array.length;i++){
        cost_array.push(best_array[i][0]);
        latency_array.push(best_array[i][1]);
        info_array.push(best_array[i][4]);
        name_array.push(best_array[i][3]);
        for(var j=0;j<3;j++){
            if(best_array[i][3]==cloud_array[j]) {
                color_array.push(colors[j]);
            }
        }
    }

    var data_ever=[{
        x: cost_array,
        y: latency_array,
        marker: { size: 7, symbol: 'circle', color: color_array},
        mode: 'lines+markers',
        showlegend: false,
        text: info_array,
        hovertext: name_array,
        line: {color: 'grey', width: 2},
        hovertemplate:
            "<b>%{hovertext}</b><extra></extra>",
        type: 'scatter'
    },legend_array[0],legend_array[1],legend_array[2]];

    var result_array_ad=ContinuumArray;
    result_array_ad.sort(function (a,b) {return a[1]-b[1];});
    var latency_array_ad=new Array();
    var cost_array_ad=new Array();
    var info_array_ad=new Array();
    for(var i=0;i<result_array_ad.length;i++){
        cost_array_ad.push(result_array_ad[i][0]);
        latency_array_ad.push(result_array_ad[i][1]);
        info_array_ad.push(result_array_ad[i][4]);
        if(i<result_array_ad.length/10){
            for(var j=0;j<3;j++){
                if(result_array_ad[i][3]==cloud_array[j]) {
                    provider_num_array[j]++;
                }
            }
        }
    }

    var data_ad=[{
        x: latency_array_ad,
        y: cost_array_ad,
        //marker: { size: 7, symbol: 'circle', color: 'steelblue'},
        //mode: 'markers',
        text: info_array_ad,
        hovertemplate:
            "<b>%{text}</b><extra></extra>",
        type: 'scatter'
    }];



    var result_array=ContinuumArray;

    var graph_array=new Array();
    for(var i=0;i<3;i++)
        graph_array.push([new Array(),new Array(),new Array()]);
    for(var i=0;i<result_array.length;i++){
        var cloud_provider;
        if(result_array[i][3]=='AWS')
            cloud_provider=0;
        if(result_array[i][3]=='GCP')
            cloud_provider=1;
        if(result_array[i][3]=='AZURE')
            cloud_provider=2;

        graph_array[cloud_provider][0].push(result_array[i][0]);
        graph_array[cloud_provider][1].push(result_array[i][6]);
        graph_array[cloud_provider][2].push(result_array[i][4]);
    }

    var graph_array_ad=new Array();
    for(var i=0;i<3;i++)
        graph_array_ad.push([new Array(),new Array(),new Array()]);
    for(var i=0;i<result_array.length;i++){
        var cloud_provider;
        if(result_array_ad[i][3]=='AWS')
            cloud_provider=0;
        if(result_array_ad[i][3]=='GCP')
            cloud_provider=1;
        if(result_array_ad[i][3]=='AZURE')
            cloud_provider=2;

        graph_array_ad[cloud_provider][0].push(result_array_ad[i][0]);
        graph_array_ad[cloud_provider][1].push(result_array_ad[i][1]);
        graph_array_ad[cloud_provider][2].push(result_array_ad[i][4]);
    }



    var data2=new Array();
    var data3=new Array();

    for(var i=0;i<3;i++){
        var Point={
            x: graph_array[i][0],
            y: graph_array[i][1],
            marker: { size: 4, symbol: 'circle', color: colors[i]},
            name: cloud_array[i],
            //mode: 'markers',
            text: graph_array[i][2],
            hovertemplate:
                "<b>%{text}</b><br><br>",
            mode: 'markers',
            type: 'scatter'
        }
        data2.push(Point);
    }

    for(var i=0;i<3;i++){
        var Point={
            x: graph_array_ad[i][1],
            y: graph_array_ad[i][0],
            marker: { size: 4, symbol: 'circle', color: colors[i]},
            name: cloud_array[i],
            //mode: 'markers',
            text: graph_array_ad[i][2],
            hovertemplate:
                "<b>%{text}</b><br><br>",
            mode: 'markers',
            type: 'scatter'
        }
        data3.push(Point);
    }

    var result_array_ad_ever=new Array();
    var best_cost=-1;
    for(var i=0;i<result_array_ad.length;i++){
        if(best_cost==-1||(best_cost-result_array_ad[i][0])>0){
            best_cost=result_array_ad[i][0];
            result_array_ad_ever.push(result_array_ad[i]);
        }
    }

    latency_array_ad=new Array();
    cost_array_ad=new Array();
    info_array_ad=new Array();
    name_array=new Array();
    var color_array_ad=new Array();
    for(var i=0;i<result_array_ad_ever.length;i++){
        cost_array_ad.push(result_array_ad_ever[i][0]);
        latency_array_ad.push(result_array_ad_ever[i][1]);
        info_array_ad.push(result_array_ad_ever[i][4]);
        name_array.push(result_array_ad_ever[i][3])
        for(var j=0;j<3;j++){
            if(result_array_ad_ever[i][3]==cloud_array[j])
                color_array_ad.push(colors[j]);
        }
    }



    var data_ad_ever=[{
        x: latency_array_ad,
        y: cost_array_ad,
        marker: { size: 7, symbol: 'circle', color: color_array_ad},
        mode: 'lines+markers',
        text: info_array_ad,
        line: {color: 'grey', width: 2},
        showlegend: false,
        hovertext: name_array,
        hovertemplate:
            "<b>%{hovertext}</b><extra></extra>",
        type: 'scatter'
    },legend_array[0],legend_array[1],legend_array[2]];


    var layout =
        {
            xaxis: {
                title: 'Cost ($/month)',
                range: [ 0, 51000 ],
                dtick: 10000
            },
            yaxis: {
                title: 'Latency (day)',
                autorange: true
            },
            legend: {
                "orientation": "h",
                x: 0.1,
                y: 1
            },
            autosize: true,
            hovermode: "closest",
            width: 750,
            height: 300,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };

    var layout_ad =
        {
            xaxis: {
                title: 'Latency (day)',
                autorange: true
            },
            yaxis: {
                title: 'Cost ($/month)',
                range: [ 0, cost*2+100 ]
            },
            legend: {
                "orientation": "h",
                x: 0.66,
                y: 1
            },
            autosize: true,
            hovermode: "closest",
            width: 750,
            height: 300,
            //title:'Pareto frontiers for State-of-the-art and Monkey Tuning'
            margin: {
                l: 60,
                r: 20,
                b: 50,
                t: 20,
                pad: 5
            }, title: ''
        };
    //Plotly.newPlot('tester5', data_ad, layout_ad);
    //Plotly.newPlot('tester', data2, layout);
   // Plotly.newPlot('tester3', data3, layout_ad);
    layout.width=375;
    layout_ad.width=375;
    Plotly.newPlot('tester6', data_ever, layout);

    console.log(best_array);
    var cost_result_text=new Array();
    if(cost<best_array[0][0])
        cost_result_text[0]="Cost is too little";
    else{

        if(best_array[best_array.length-1][0]<cost) {
            cost_result_text[0]=("Hey! We found you 1 options.<br><br>");
            drawDiagram(ContinuumArray[best_array.length-1][5], 'cost_result_diagram1');
            cost_result_text[2] = best_array[best_array.length - 1][4];
        }else {
            for (var i = 1; i < best_array.length; i++) {
                if (best_array[i][0] > cost) {
                    drawDiagram(ContinuumArray[i-1][5], 'cost_result_diagram1');
                    drawDiagram(ContinuumArray[i][5], 'cost_result_diagram2');
                    cost_result_text[0]=("Hey! We found you 2 options.<br><br>");
                    cost_result_text[1]="<b>Option1:</b>"
                    cost_result_text[2] = best_array[i - 1][4];
                    cost_result_text[3] = "<b>Option2:</b>";
                    cost_result_text[4] = best_array[i][4];
                    break;
                }
            }
        }
    }

    document.getElementById("cost_result_p1").innerHTML=cost_result_text[0];
    document.getElementById("cost_result_p2").innerHTML=cost_result_text[1];
    document.getElementById("cost_result_p3").innerHTML=cost_result_text[2];
    document.getElementById("cost_result_p4").innerHTML=cost_result_text[3];
    document.getElementById("cost_result_p5").innerHTML=cost_result_text[4];

    $("#chart_style").change(function(){
        var chart;
        if(this.value=='1'){
            chart=initChart(ContinuumArray,0,1,"Cost ($/month)","Latency (day)", 0);
            provider_num_array=chart.provider_num_array;
            Plotly.newPlot('tester6', chart.data, chart.layout);
        }
        if(this.value=='2'){
            chart=initChart(ContinuumArray,1,0,"Latency (day)","Cost ($/month)", 0);
            provider_num_array=chart.provider_num_array;
            Plotly.newPlot('tester6', chart.data, chart.layout);
        }
        if(this.value=='3'){
            chart=initChart(ContinuumArray,0,6,"Cost ($/month)","Memory (GB)", 1);
            provider_num_array=chart.provider_num_array;
            Plotly.newPlot('tester6', chart.data, chart.layout);
        }

        var myPlot = document.getElementById('tester6');
        console.log(myPlot);
        myPlot.on('plotly_hover', function(data){
            var hoverInfo = document.getElementById('hoverinfo6');
            hoverInfo.innerHTML=(data.points[0].text);
            //console.log(data);
            //hoverInfo.innerHTML = infotext.join('<br/>');
            for(var i in ContinuumArray){
                if(data.points[0].text==ContinuumArray[i][4])
                    drawDiagram(ContinuumArray[i][5], 'diagram6');
            }
        })

        $("#diagram6").html("Out of top 10% designs,<br>"+(provider_num_array[0]*100/ContinuumArray.length).toFixed(2)+"% are of AWS,<br>"+(provider_num_array[1]*100/ContinuumArray.length).toFixed(2)+"% are of GCP,<br>and "+(provider_num_array[2]*100/ContinuumArray.length).toFixed(2)+"% are of AZURE.");
        $("#hoverinfo6").html("");
        $("#tester6").hover(function(){
        }, function() {
            $("#hoverinfo6").html("Out of top 10% designs,<br>"+(provider_num_array[0]*100/ContinuumArray.length).toFixed(2)+"% are of AWS,<br>"+(provider_num_array[1]*100/ContinuumArray.length).toFixed(2)+"% are of GCP,<br>and "+(provider_num_array[2]*100/ContinuumArray.length).toFixed(2)+"% are of AZURE.");
        });
    });

    var myPlot = document.getElementById('tester6');
    console.log(myPlot);
    myPlot.on('plotly_hover', function(data){
        var hoverInfo = document.getElementById('hoverinfo6');
        hoverInfo.innerHTML=(data.points[0].text);
        //console.log(data);
        //hoverInfo.innerHTML = infotext.join('<br/>');
        for(var i in ContinuumArray){
            if(data.points[0].text==ContinuumArray[i][4])
                drawDiagram(ContinuumArray[i][5]);
        }
    })


    $("#tester6").hover(function(){
    }, function() {
        $("#hoverinfo6").html("Out of top 10% designs,<br>"+(provider_num_array[0]*100/ContinuumArray.length).toFixed(2)+"% are of AWS,<br>"+(provider_num_array[1]*100/ContinuumArray.length).toFixed(2)+"% are of GCP,<br>and "+(provider_num_array[2]*100/ContinuumArray.length).toFixed(2)+"% are of AZURE.");
    });

    $(document).ready(function(){
        $("#diagram6").html("Out of top 10% designs,<br>"+(provider_num_array[0]*100/ContinuumArray.length).toFixed(2)+"% are of AWS,<br>"+(provider_num_array[1]*100/ContinuumArray.length).toFixed(2)+"% are of GCP,<br>and "+(provider_num_array[2]*100/ContinuumArray.length).toFixed(2)+"% are of AZURE.");
    });


}