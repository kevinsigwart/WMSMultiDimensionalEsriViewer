var dimField = "depth";
var dimValueField = "value";
var dimTimeField = "time";
var dimActFieldValue = "actvalue";
var dimSlicesTable = null;
var selectedDimSliderIndex = 0;
var dimSelectionAtr = "Selection";
var units = 'meters';
var currentSelectedDimensionValue = -2;
var nDimMode = "noChartMode";  //noChartMode and ChartMode

function nDimSlider(dimField,units,defaultValue) {

	//Properties
	this.getDimensionValue = dimSliderGetDimensionValue;
	this.setDimensionField = nDimSliderSetDimensionField;
    this.setValueField = nDimSliderSetValueField;
	this.setDefaultValue = nDimSliderSetDefaultValue;
	this.setDimensionUnits = nDimSliderSetUnits;
	
	//Methods
	this.setSlices = nDimSliderSetDimensionSlices;
    this.setTable = nDimSliderSetTable;
	this.createDimensionSlider = nDimSliderCreateEventSlider;
	this.createDimensionalChart = nDimSliderCreateChartSlider;
    this.removeChart = nDimSliderDeleteChart;
	
	//Events
	updateDimSliderEvent = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	updateDimSliderEvent.initEvent("DimSliderDateChanged",true,true);	
}

function nDimSliderSetValueField(value)
{
    dimValueField = value;  
}

function nDimSliderSetDimensionField(value)
{
	dimField = value;
}

function nDimSliderSetDefaultValue(value)
{
	currentSelectedDimensionValue = value;
}

function nDimSliderSetUnits(value)
{
	units = value;
}

function nDimSliderSetTable(value)
{
    dimSlicesTable = value;
}

function nDimSliderSetDimensionSlices(dimensionValues,isDepth)
{
	var slices = [];
	for (index=0;index <  dimensionValues.length;index++)
	{
		var ob = [];
		var value = parseFloat(dimensionValues[index]);
		var invertedDepthValue = value;
		if(isDepth)
			invertedDepthValue = invertedDepthValue * -1;
		
		//if(value != 0) //When using a Log D3 chart there is a bug that doesn't let you use 0 values'
		//{	
			ob[dimField] = invertedDepthValue;
			ob[dimValueField] = 0;
			ob[dimActFieldValue] = value;
			slices.push(ob);
		//}
       /* else
        {
			ob[dimField] = -.1;
			ob[dimValueField] = 0;
			ob[dimActFieldValue] = .1;
			slices.push(ob);            
        }*/
	}	
	
	dimSlicesTable = slices;
}

/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function nDimSliderAddSliderPlot(margin, width, height)
{
	var panel= d3.select("#elevationSliderPanel");
	var svg = d3.select("#elevationSliderPanel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	return svg;
}

/**
 * Creates a Time Series chart as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 */
function nDimSliderCreateEventSlider()
{
	var features = dimSlicesTable;
			
	nDimSliderWidth = getnDimSliderSliderWidth();
	eventSliderHeight = getnDimSliderSliderHeight();

	var margin = {top: 25, right: 5, bottom: 5, left: 50},
	width = nDimSliderWidth - margin.left - margin.right, 
	height = eventSliderHeight - 5; 
	
	
	//Adding the plot framwork to the application
	var svg = nDimSliderAddSliderPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.log().range([height, 0]);

	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6, d3.format(",.1s"));

	var line = d3.svg.line().x(function(d) {
		return x(0);
	}).y(function(d) {
        var yValue = d[dimField];
        if(yValue == 0)
            yValue = -1
		return y(yValue);
	});		
	

	x.domain(d3.extent(features, function(d) {
		return 0;
	}));
	
	
	y.domain(d3.extent(features, function(d) {
        var yValue = d[dimField];
        if(yValue == 0)
            yValue = -1
		return yValue;
	})).nice(); 
    
	//Axis Label
	svg.append("g")
	.attr("class", "y axis").call(yAxis).append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", "-40").style("text-anchor", "end")
	.text(dimField + " (" + units + ")");
	
	svg.append("path").datum(features).attr("class", "line").attr("d", line);
	
    
	svg.selectAll(".dsDot")
	.data(features)
	.enter().append("circle")
	.attr("class", "dsDot")
	.attr("r", 3)
	.attr("cx", function(d) { return x(d[dimValueField]); })
	.attr("cy", function(d) { 
        var yValue = d[dimField];
        if(yValue == 0)
            yValue = -1
		return y(yValue);
    })
	.on("click",nDimSliderMouseClick)
	.on("mouseover",nDimSliderOnMouseOver)
	.on("mouseout",nDimSliderOnMouseOut) 
	.append("svg:title").text(function(d) {
		return (d[dimField]).toString() + " " + units;
	}); 
	
	
	svg.append("text")
        .attr("x", 0)          
        .attr("y", 0 - (margin.top / 2))
        .attr("id", "Title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("text-decoration", "underline")  
        .text(dimField + ": " + currentSelectedDimensionValue.toString()); 
	
  	//We want to highlight the current view of the map
	nDimSliderChangeEventStep();	
}

function filterToDate(table,dateFilterValue){
    
    var filteredTable = [];
  	for (index=0;index <  table.length;index++)
	{  
        var feature = table[index];
        var attributeDate = new Date(feature.attributes["time"]);
        if(attributeDate.toISOString() == dateFilterValue.toISOString())// && feature.attributes["depth"] != 0)
            filteredTable.push(feature);
    }
    
    return filteredTable;  
}

/**
 * Creates a Time Series chart as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 */
function nDimSliderCreateChartSlider(filterValue)
{
    nDimMode = "ChartMode";
    
	var features = filterToDate(dimSlicesTable,filterValue);
			
	nDimSliderWidth = getnDimSliderSliderWidth();
	eventSliderHeight = getnDimSliderSliderHeight();

	var margin = {top: 25, right: 5, bottom: 20, left: 45},
	width = nDimSliderWidth - margin.left - margin.right,
	height = eventSliderHeight - 20; 
	
	
	//Adding the plot framwork to the application
	var svg = nDimSliderAddSliderPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.scale.linear().range([0, width]);
	var y = d3.scale.log().range([height, 0]);
	
	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(3,d3.format(",.1s"));
	var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6, d3.format(",.1s"));

	var line = d3.svg.line().x(function(d) {
		return x(d.attributes[dimValueField]);
	}).y(function(d) {
        var yValue = d.attributes[dimField] * -1;
        if(yValue == 0)
            yValue = -1;
		return y(yValue);
	});		
	

	x.domain(d3.extent(features, function(d) {
		return d.attributes[dimValueField];
	}))
	
	
	y.domain(d3.extent(features, function(d) {
        var yValue = d.attributes[dimField] * -1;
        if(yValue == 0)
            yValue = -1;
        
		return yValue;
	})).nice(); 

	//Axis Labels
    /*svg.append("g").attr("class", "x axis")
       .call(xAxis);*/
    
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis().scale(x).ticks(3));
       
    
	svg.append("g")
	.attr("class", "y axis").call(yAxis).append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", "-40").style("text-anchor", "end")
	.text(dimField + " (" + units + ")");
	
	svg.append("path").datum(features).attr("class", "line").attr("d", line);
	
    var color = d3.scale.linear()
    .domain([-1.86,9, 20, 30])
    .range(["blue","cyan", "yellow", "red"]);
    
	svg.selectAll(".dsChartDot")
	.data(features)
	.enter().append("circle")
	.attr("class", "dsChartDot")
	.attr("r", 4)
	.attr("cx", function(d) { return x(d.attributes[dimValueField]); })
	.attr("cy", function(d) { 
        var yValue = d.attributes[dimField] * -1;
        if(yValue == 0)
            yValue = -1;
        return y(yValue);
    })
    .style('fill', function(d) {
        return d.color = color(d.attributes[dimValueField]);
    })  
	.on("click",nDimSliderMouseClick)
	.on("mouseover",nDimSliderOnMouseOver)
	.on("mouseout",nDimSliderOnMouseOut) 
	.append("svg:title").text(function(d) {
        var timeValue = new Date(d.attributes[dimTimeField]);
        var displayDate = nDimSliderhandleDate(timeValue);
        
		return (dimField + " : " + d.attributes[dimField].toString() + " " + units + "\n" + dimValueField + " : " + d.attributes[dimValueField].toString() + "\n" + dimTimeField + " : " + displayDate ) ;
	}); 
	
    var textTitle = dimField + ": " + currentSelectedDimensionValue.toString();
	
	svg.append("text")
        .attr("x", 0 + (width/2) - textTitle.length)          
        .attr("y", 0 - (margin.top / 2))
        .attr("id", "Title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("text-decoration", "underline")  
        .text(dimField + ": " + currentSelectedDimensionValue.toString()); 
	
  	//We want to highlight the current view of the map
	nDimSliderChangeEventStep();	
}


function getnDimSliderSliderWidth()
{
	totalPossibleWidth = document.getElementById('elevationSliderPanel').offsetWidth;
	
	return totalPossibleWidth * .90;
}

function getnDimSliderSliderHeight()
{
	totalPossibleHeight = document.getElementById('elevationSliderPanel').offsetHeight;
	
	return totalPossibleHeight * .90;	
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function nDimSliderMouseClick(d,i)
{
	selectedDimSliderIndex = i;
	
	nDimSliderChangeEventStep();
	
	document.dispatchEvent(updateDimSliderEvent);
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function nDimSliderOnMouseOver(d,i)
{
    
	var svg = d3.select("#elevationSliderPanel").select("svg");
    var circles;
    if(nDimMode == "ChartMode")
    {
        circles = svg.selectAll(".dsChartDot");
        var selectedCircle = circles[0][i];	
        selectedCircle.setAttribute("r", 6);
    }
    else
    {
        circles = svg.selectAll(".dsDot");  
        var selectedCircle = circles[0][i];	
        selectedCircle.setAttribute("r", 5);       
    }
}

/**
 *This event is fired off when the mouse is no longer hovering
 */
function nDimSliderOnMouseOut(d,i)
{	
    	var svg = d3.select("#elevationSliderPanel").select("svg");
    var circles;
    if(nDimMode == "ChartMode")
    {
        circles = svg.selectAll(".dsChartDot");
        var selectedCircle = circles[0][i];	
        selectedCircle.setAttribute("r", 4);
    }
    else
    {
        circles = svg.selectAll(".dsDot");  
        var selectedCircle = circles[0][i];	
        selectedCircle.setAttribute("r", 3);       
    }
}



function dimSliderSelectDimStep()
{
	var svg = d3.select("#elevationSliderPanel").select("svg");
	
    var circles;
    if(nDimMode == "ChartMode")
    {
        circles = svg.selectAll(".dsChartDot");
        currentSelectedDimensionValue = circles[0][selectedDimSliderIndex].__data__.attributes[dimField];	
    }
    else
    {
        circles = svg.selectAll(".dsDot");   
        currentSelectedDimensionValue = circles[0][selectedDimSliderIndex].__data__[dimActFieldValue];	
    }
    
	for(var index = 0; index < circles[0].length; index++)
	{
		var chartDotCircle = circles[0][index];
		
		chartDotCircle.__data__[dimSelectionAtr] = false;
        circles[0][index].style.stroke = "steelblue";	
        circles[0][index].style.strokeWidth=".75";	
	}
	
    
	circles[0][selectedDimSliderIndex].style.stroke = "cyan";	
    circles[0][selectedDimSliderIndex].style.strokeWidth="4";	
	//circles[0][selectedDimSliderIndex].setAttribute("r", 6);	
	circles[0][selectedDimSliderIndex].__data__[dimSelectionAtr] = true;	
	
    	
	var textAll = svg.selectAll("#Title");
	textAll[0][0].textContent = dimField + ": " + currentSelectedDimensionValue.toString();			
}



/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function nDimSliderChangeEventStep()
{
	var svg = d3.select("#elevationSliderPanel").select("svg");
	
    var circles;
    if(nDimMode == "ChartMode")
        circles = svg.selectAll(".dsChartDot");
    else
        circles = svg.selectAll(".dsDot");   
    
	var selectedItem = circles[0][selectedDimSliderIndex];
	
	dimSliderSelectDimStep();
}

function dimSliderGetDimensionValue()
{
	return currentSelectedDimensionValue;
}

/**
 * 
 */
function nDimSliderDeleteChart()
{
	var oldSVG = d3.select("#elevationSliderPanel").select("svg");
    if(oldSVG != null)
    	oldSVG.remove();	
}

/**
 * 
 */
function nDimSliderUpdateChartSize()
{
	d3DeleteChart();
	d3CreateEventSlider(timeSlicesTable);
}

function nDimSliderhandleDate(dateTime){
    var dateTimeString;
    
    dateTimeString = (currentDateTime.getUTCMonth() + 1) + "/" + currentDateTime.getUTCDate() + "/" + currentDateTime.getUTCFullYear();
    
    if(currentDateTime.getUTCHours() != "0" && currentDateTime.getUTCHours() <= 12)
        dateTimeString += " " + currentDateTime.getUTCHours() + ":00:00" + " AM";
    else
        dateTimeString += " " + (currentDateTime.getUTCHours() - 12) + ":00:00" + " PM";
    
    return dateTimeString;
    
}