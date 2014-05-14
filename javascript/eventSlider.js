var timeSliderDateLabel = "Date: January";
var selectedEventSliderIndex = 0;
var currentDateTime = null;
var currentDateTimeString = '';
var timeSlicesTable = null;
var eventSliderPlayActive = false;
var tsChartPointSelected = "Selected";
var valueField = "value";
var timeField = "time";
var actValueField = "actvalue";
var sliderMode = "timeMode";  //timeMode and chartMode
var filterValue = 2;

/**
 *Class Name: EventSlider
 * Description: Is like a time-slider except each event/time slice is represented as an individual point.
 * This supports time slices that are not at equal intervals 
 */
function EventSlider() {
	
	//Methods
	this.setTimeSlices = d3SetTimeSlices;
	this.generateChart = d3CreateEventSlider;
    this.generateTimeGraph = d3CreateChartEventSlider;
	this.setTimeField = eventSliderSetTimeField;
	this.setValueField = eventSliderSetValueField;
    this.getChartMode = eventSliderGetChartMode;
    
	//this.setTimeSliderDateLabel = d3SetTimeSliderDateLabel;
	//this.getTimeSliderDateLabel = d3GetTimeSliderDateLabel;
	this.getDateTime = eventSliderGetDateTime;
	this.getDateTimeInitialValue = eventSliderGetDateTimeInitialValue;
	this.isPlayActive = getEventSliderPlayActive;
	this.isSlidersLastSpot = isLastStep;
	this.isSlidersFirstSpot = isFirstStep;
	this.moveSliderForward = eventSliderMoveForward;
	this.moveSliderBackward = eventSliderMoveBackword;
	this.playButtonClicked = eventSliderPlayButtonClicked;
	this.selectNewTimeStep = eventSliderSelectTimeStep;
	this.updateChartSize = d3UpdateChartSize;
    this.setPlotTable = d3SetPlotTable;
    this.removeChart = d3DeleteChart;
	
	
	
	var myVar=setInterval(function(){myTimer();},3000);
		
	//Events
	updateEventSliderTimeEvent = document.createEvent("Event");
	//We need to let the mapping client know when a point has been selected on the map
	updateEventSliderTimeEvent.initEvent("EventSliderDateChanged",true,true);	
}

/****** Get/Set Properties *******************************/
function eventSliderGetChartMode()
{
    return sliderMode;   
}
function getEventSliderPlayActive()
{
	return eventSliderPlayActive;
}
function d3GetTimeSliderDateLabel()
{
	return timeSliderDateLabel;
}
function d3SetTimeSliderDateLabel(value)
{
	timeSliderDateLabel = value;
}
function eventSliderGetDateTime()
{
	return currentDateTime;
}
function eventSliderGetDateTimeInitialValue()
{
	return currentDateTimeString;
}

/**
 *Sets the time dimension field 
 */
function eventSliderSetTimeField(value)
{
	timeField = value;
}
function eventSliderSetValueField(value)
{
    valueField = value;   
}


function d3SetTimeSlices(timeValues)
{
	var timeSlices = [];
	for (index=0;index <  timeValues.length;index++)
	{
		var ob = [];
		var timeString = timeValues[index].trim();
		var dateTimeNum = Date.parse(timeString);
		var dateTime = new Date(dateTimeNum);
		
  		var ob = [];
  		ob.attributes = [];
  		ob.attributes[timeField] = dateTime;
  		ob.attributes[valueField] = 0;
  		ob.attributes[actValueField] = timeString;
  		
  		timeSlices.push(ob);
	}	
	
	timeSlicesTable = timeSlices;	
}

function d3SetPlotTable(timeSlices)
{
	timeSlicesTable = timeSlices;	    
}

function myTimer()
{	
	if(eventSliderPlayActive)
		eventSliderMoveForward();
}



/**
 *Adds the Plot Framework to the Application 
 * @param {Object} margin
 * @param {Object} width
 * @param {Object} height
 */
function addSliderPlot(margin, width, height)
{    	
	var panel= d3.select("#eventSliderPanel");
	var svg = d3.select("#eventSliderPanel").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  	.append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    
	return svg;
}

function d3CreateEventSlider()
{
    if(sliderMode == "timeMode") 
        d3GenerateTimeSlider();
    else
        d3CreateChartEventSlider(filterValue);
}

/**
 * Creates a Time Series chart as a line graph, and then fills in the area up to the current date. 
 * 
 * @param {Object} features:  All the features that make up the time series (be sure the features have both a value and dimension property)
 */
function d3GenerateTimeSlider()
{	
	features = timeSlicesTable;
	
	timeSliderWidth = getEventSliderWidth();
	
	//var margin = {top: 20, right: 15, bottom: 20, left: 15}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	var margin = {top: 20, right: 15, bottom: 20, left: 35},
	width = timeSliderWidth - margin.left - margin.right; // timeSliderWidth + margin.left + margin.right ; // - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 2; //185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	
	//Adding the plot framwork to the application
	var svg = addSliderPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
	//var yAxis = d3.svg.axis().scale(y).orient("left");
	
	var line = d3.svg.line().x(function(d) {
		return x(d.attributes[timeField]);
	}).y(function(d) {
		return y(d.attributes[valueField]);
	});		
	

	x.domain(d3.extent(features, function(d) {
		return d.attributes[timeField];
	}));
	
	
	y.domain(d3.extent(features, function(d) {
		return 0;
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

	svg.append("path").datum(features).attr("class", "line").attr("d", line);
	

    svg.selectAll(".tsDot")
    .data(features)
    .enter().append("circle")
    .attr("class", "tsDot")
    .attr("r", 3.5)
    .attr("cx", function(d) { return x(d.attributes[timeField]); })
    .attr("cy", function(d) { return y(d.attributes[valueField]);})
    .on("click",eventSliderMouseClick)
    .on("mouseover",eventSliderOnMouseOver)
    .on("mouseout",eventSliderOnMouseOut) 
    .append("svg:title").text(function(d) {
        return (d.attributes[actValueField]).toString();
    }); 

	
	svg.append("text")
        .attr("x", (width / 2))          
        .attr("y", 0 - (margin.top / 2))
        .attr("id", "Title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("text-decoration", "underline")  
        .text(timeSliderDateLabel);
	
  	//We want to highlight the current view of the map
	changeEventStep();	
}

function d3CreateChartEventSlider(dimFilter)
{
    sliderMode = "chartMode";
    
	features = filterTable(timeSlicesTable,dimFilter);
	
	timeSliderWidth = getEventSliderWidth();
	
	//var margin = {top: 20, right: 15, bottom: 20, left: 15}, //var margin = {top: 10, right: 1, bottom: 30, left: 50},
	var margin = {top: 20, right: 15, bottom: 20, left: 56},
	width = timeSliderWidth - margin.left - margin.right; // timeSliderWidth + margin.left + margin.right ; // - 90 - margin.left - margin.right, //880 - margin.left - margin.right, //225 - margin.left - margin.right,
	height = 185 - margin.top - margin.bottom; //300 - margin.top - margin.bottom;
	
	
	//Adding the plot framwork to the application
	var svg = addSliderPlot(margin, width, height);
	
	//Configuring the Plot
	var x = d3.time.scale().range([0, width]);
	var y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(4);
    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(6);
	    
	var line = d3.svg.line()
        .x(function(d) {
		    return x(d.attributes[timeField]);
	    })
        .y(function(d) {
		return y(d.attributes[valueField]);
	    });		
	

	x.domain(d3.extent(features, function(d) {
		return d.attributes[timeField];
	}));
	
	
	y.domain(d3.extent(features, function(d) {
		return d.attributes[valueField];
	})); 

	svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

    svg.append("g").attr("class", "y axis").call(yAxis)
       .append("text").attr("transform", "rotate(-90)")
       .attr("y", 6).attr("dy", "-48")
       .style("text-anchor", "end").text(valueField);
    
	svg.append("path")
        .datum(features)
        .attr("class", "line")
        .attr("d", line);
    
    //Creating a color ramp to mimick the legend in the map
	var color = d3.scale.linear()
        .domain([-1.86,9, 20, 30])
        .range(["blue","cyan", "yellow", "red"]);
    
    svg.selectAll(".tsDot")
    .data(features)
    .enter().append("circle")
    .attr("class", "tsDot")
    .attr("r", 6)
    .style('fill', function(d) {
        return d.color = color(d.attributes[valueField]);
    })  
    .attr("cx", function(d) { return x(d.attributes[timeField]); })
    .attr("cy", function(d) { return y(d.attributes[valueField]);})
    .on("click",eventSliderMouseClick)
    .on("mouseover",eventSliderOnMouseOver)
    .on("mouseout",eventSliderOnMouseOut) 
    .append("svg:title").text(function(d) { 
        
        var dateString = d3handleDate(new Date(d.attributes[timeField]));
        
        return valueField.replace("_"," ") + ": " + d.attributes[valueField] + "\n" + "Depth: " + d.attributes['depth'] + "\n" + timeField + ": " + dateString; 
    
    });         
	
	svg.append("text")
        .attr("x", (width / 2))          
        .attr("y", 0 - (margin.top / 2))
        .attr("id", "Title")
        .attr("text-anchor", "middle")  
        .style("font-size", "14px") 
        .style("text-decoration", "underline")  
        .text(timeSliderDateLabel);
	
  	//We want to highlight the current view of the map
	changeEventStep();	    
}

function filterTable(table,filterValue){
    var filteredTable = [];
  	for (index=0;index <  table.length;index++)
	{  
        var feature = table[index];
        if(feature.attributes["depth"] == filterValue)
            filteredTable.push(feature);
    }
    
    return filteredTable;
}



function getEventSliderWidth()
{
	totalPossibleWidth = document.getElementById('eventSliderPanel').offsetWidth;
	
	return totalPossibleWidth * .90;
}


/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function eventSliderMouseClick(d,i)
{
	selectedEventSliderIndex = i;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *This event is fired off when an plot point is clicked.
 * We highlight the point on the chart and send out another event
 * so the map knows to highlight the point. 
 */
function eventSliderOnMouseOver(d,i)
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	var circles = svg.selectAll(".tsDot");
	var selectedCircle = circles[0][i];	
    selectedCircle.setAttribute("r", 8);
}

/**
 *This event is fired off when the mouse is no longer hovering
 */
function eventSliderOnMouseOut(d,i)
{	
	var svg = d3.select("#eventSliderPanel").select("svg");
	var circles = svg.selectAll(".tsDot");
	var selectedCircle = circles[0][i];	
	selectedCircle.setAttribute("r", 6);	
}

function eventSliderPlayButtonClicked()
{
	if(eventSliderPlayActive)
		eventSliderPlayActive = false;
	else
		eventSliderPlayActive = true;
}

/**
 *Move the event slider one spot forward to the next event 
 */
function eventSliderMoveForward()
{
	if(!isLastStep())
		selectedEventSliderIndex++;
	else
		selectedEventSliderIndex = 0;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);
}

/**
 *Move the event slider one spot backwards to the previous event 
 */
function eventSliderMoveBackword()
{
	selectedEventSliderIndex--;
	
	changeEventStep();
	
	document.dispatchEvent(updateEventSliderTimeEvent);	
}

function eventSliderSelectTimeStep(dateTime)
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".tsDot");
	for(var index = 0; index < circles[0].length; index++)
	{
		var chartDotCircle = circles[0][index];
		
		var dotDateValue = new Date(chartDotCircle.__data__.attributes[timeField]);
		
		if(dotDateValue.getTime() == dateTime.getTime()) 
		{
				
			chartDotCircle.style.stroke = "cyan";	
            chartDotCircle.style.strokeWidth = "3";	
			
			//Marking chart point as selected so we know when mousing over the point.
			chartDotCircle.__data__.attributes[tsChartPointSelected] = true;
			
            var chartStringValue;
            if(sliderMode == "timeMode")
                chartStringValue = chartDotCircle.__data__.attributes[actValueField];
            else
            {
                currentDateTime = new Date(chartDotCircle.__data__.attributes[timeField]);
                
                chartStringValue =  d3handleDate(currentDateTime);
                
            }

			//Use Dimension Name
			var chartingDateLabel = timeField + ": " + chartStringValue; 
	
			var textAll = svg.selectAll("#Title");
			textAll[0][0].textContent = chartingDateLabel;		
			
			//Save the selected index
			selectedEventSliderIndex = index;
		}
		else
		{
			chartDotCircle.style.stroke = "steelblue";	
            chartDotCircle.style.strokeWidth = ".75";	
			chartDotCircle.setAttribute("r", 6);
			chartDotCircle.__data__.attributes[tsChartPointSelected] = false;
		}
	}	
}


/**
 * Checking if we are currently on the last event
 */
function isLastStep()
{
	var lastStep = false;
	totalSteps = getStepsCount();
	if(totalSteps != 0)
	{
		if(selectedEventSliderIndex + 1 >= totalSteps)
			lastStep = true;
	}
		
	return lastStep;
}
/**
 *Check if we are on the first event 
 */
function isFirstStep()
{
	var firstStep = false;
	if(selectedEventSliderIndex == 0)
		firstStep = true;
	return firstStep;
}
/**
 *Gets the total number of events 
 */
function getStepsCount()
{
	var length = 0;
	
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".tsDot");
	if(circles != null && circles.length > 0)
		length= circles[0].length;
		
	return length;
}

/**
 *Highlights the selected point and sets the other points back to the original value 
 */
function changeEventStep()
{
	var svg = d3.select("#eventSliderPanel").select("svg");
	
	var circles = svg.selectAll(".tsDot");
	var selectedItem = circles[0][selectedEventSliderIndex];
    
    if(sliderMode == "timeMode")
    {
	   currentDateTime = new Date(selectedItem.__data__.attributes[timeField]);
	   currentDateTimeString = selectedItem.__data__.attributes[actValueField];
    }
    else{
        currentDateTime = new Date(selectedItem.__data__.attributes[timeField]);
        currentDateTimeString =  d3handleDate(currentDateTime);
    }
	
	eventSliderSelectTimeStep(currentDateTime);
}

/**
 * 
 */
function d3DeleteChart()
{
	var oldSVG = d3.select("#eventSliderPanel").select("svg");
    if(oldSVG != null)
    	oldSVG.remove();	
}

/**
 * 
 */
function d3UpdateChartSize()
{
	d3DeleteChart();
	d3CreateEventSlider(timeSlicesTable);
}

function d3handleDate(dateTime){
    var dateTimeString;
    
    dateTimeString = (dateTime.getUTCMonth() + 1) + "/" + dateTime.getUTCDate() + "/" + dateTime.getUTCFullYear();
    
    if(dateTime.getUTCHours() > 12)
        dateTimeString += " " + (dateTime.getUTCHours() - 12) + ":00:00" + " PM";
    else if (dateTime.getUTCHours() != "0")
        dateTimeString += " " + dateTime.getUTCHours() + ":00:00" + " AM";
    
    return dateTimeString;
    
}
