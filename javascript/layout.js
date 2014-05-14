dojo.require("esri.map");
dojo.require('esri.dijit.Attribution');
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.layers.DynamicMapServiceLayer");
dojo.require("dojo/json");

//GLOBALS
  var map;
  var wmsService = "http://dtc-sci02.esri.com/arcgis/services/201404_Multidimensional/WaterTemperature/MapServer/WMSServer";
  var eventSliderOb = null;
  var dimSliderOb = null;
  var esriMapOb = null;
  var timeDim = '';
  var nDim = '';
  var netCDFGPQueryOb = null;  

/**
 *Fires off when the web pages is loaded 
 */  
function initMap() {
   	
    esri.config.defaults.io.proxyUrl =  location.protocol + '//' + location.host + "/sharing/proxy.ashx";
    esri.config.defaults.io.alwaysUseProxy = false;
      	
  	require(["esri/map", "dojo/domReady!"], function(Map) { 
    map = new Map("map", {
      center: [-56.049, 38.485],
      zoom: 3,
      basemap: "oceans"
    });
  	});
  	
  	require([
      "esri/map", 
      "esri/dijit/BasemapToggle",
      "dojo/domReady!"
    ], function(
      Map, BasemapToggle
    ){
	var toggle = new BasemapToggle({
        map: map,
        basemap: "gray"
      }, "BasemapToggle");
      toggle.startup();
     });
    
    document.addEventListener("WMSAddedToMapEvent",wmsLayerAddedToMap,false);  	 
    
	//add chrome theme for popup.  
    dojo.addClass(map.infoWindow.domNode, "chrome");    
    
    if(esriMapOb == null)
		esriMapOb = new esriMap(map,wmsService);
    
    if(netCDFGPQueryOb == null)
    {
    	netCDFGPQueryOb = new NetCDFGPQuery("http://dtc-sci02.esri.com/arcgis/rest/services/201404_Multidimensional/MakeWaterTempTable/GPServer/Make%20Multidimensional%20NetCDF%20Table");
    	document.addEventListener("NetCDFGPQueryGotQueryResults",gotNetCDFQueryResults,false);
    }
    
    tb = new esri.toolbars.Draw(map);
    dojo.connect(tb, "onDrawEnd", addGraphic);


}

function addGraphic(geometry){
    
    esriMapOb.addPointToMap(geometry);
    netCDFGPQueryOb.queryPoint(geometry);
    
}


/**
 *Fired off when user clicks Add WMS Layer button  
 * Add the selected layer to the map, then add the dimensions values
 * to the charts
 */
function wmsLayerAddedToMap()
{	
    var wmsLayer = esriMapOb.getWMSLayer();
    //Get Dimension Values from WMS Layer
    var dimensions = wmsLayer.getDimensions();
    
    //Currently only supports 2 (besides lat,lon) dimensions and one must be time/date
    timeDim = '';
    nDim = '';
    for(index = 0; index < dimensions.length; index++)
    {
    	var dim = dimensions[index];
    	if(dim.indexOf("time") != -1 || dim.indexOf("date") != -1 )
    		timeDim = dim;
    	else
    		nDim = dim;
    }
    
    require(["dojo/dom-style"], function(domStyle){
    //Only show the Time/Event Slider when there is a time dimension
    if(timeDim != '')
    {
    	if(eventSliderOb == null)
    	{
    		eventSliderOb = new EventSlider();
    		document.addEventListener("EventSliderDateChanged",updateMapTime,false);
    	}
    
    	var timeValues = wmsLayer.getDimensionValues(timeDim);
    	eventSliderOb.setTimeField(timeDim);
    	eventSliderOb.setTimeSlices(timeValues);
    	eventSliderOb.generateChart();
    	
    	//Show the Event Slider.
    	var footerElem = document.getElementById('footer');
    	footerElem.style.visibility = 'visible';
    }
    
    //Only show the n Dim Slider when there is a dimension other than time
    if(nDim != '')
    {
    	if(dimSliderOb == null)
    	{
    		dimSliderOb = new nDimSlider();
    		document.addEventListener("DimSliderDateChanged",updateDimension,false);
    	}
    	var dimValues = wmsLayer.getDimensionValues(nDim);
    	
    	var dimParams = wmsLayer.getDimensionProperties(nDim);
    	dimSliderOb.setDimensionField(nDim);
    	dimSliderOb.setDimensionUnits(dimParams.units);
    	dimSliderOb.setDefaultValue(dimParams.defaultValue);
    	
    	//We want to check if it's a depth value, because then the dim slider inverses the values'
    	var isDepthValue = false;
    	if(nDim.toLowerCase().indexOf('depth') != -1)
    		isDepthValue = true;
    		
    	dimSliderOb.setSlices(dimValues,isDepthValue);
    	dimSliderOb.createDimensionSlider();
    	
    	//Show the Dimension Slider.
    	var leftChartElem = document.getElementById('leftChart');
  		leftChartElem.style.visibility = 'visible';
    }
	
		//We want to make sure that the current time is shown
	    updateMapTime();
	});
}

function resetLayout(){
	if(eventSliderOb != null){
		//When the application is rezied, we want to refresh the graph
		eventSliderOb.updateChartSize();
	}	
}

var utils = {
	applyOptions : function(configVariable, newConfig) {
		var q;

		//Override any config options with query parameters
		for (q in newConfig) {
			configVariable[q] = newConfig[q];
		}
		return configVariable;
	},
	mapResize : function(mapNode) {
		//Have the map resize on a window resize
		dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
	},
	onError : function(error) {
		console.log('Error occured');
		console.log(error);
	}
};	



function updateDimension()
{
	//Gets the current selected dimension value from the Dimension Slider
	var dimensionValue = dimSliderOb.getDimensionValue();
	var wmsLayer = esriMapOb.getWMSLayer();
    
	//Update with dimension from WMS Layer
	wmsLayer.paramsOb[nDim] = dimensionValue.toString();
	wmsLayer.refresh();
    
    //Update Time Chart
    if(eventSliderOb.getChartMode() != "timeMode")
    {
        eventSliderOb.removeChart();
        eventSliderOb.generateTimeGraph(dimensionValue);
    }
}

function animationShow(ob)
{
	//graphingWidget.style.top = '130px';
}  

function animationHide(ob)
{
	//graphingWidget.style.top = '60px';
}    
  
  function updateAnimationWidget(dateTimeStr)
  {
	  	//animationDateTimeLabel.textContent = dateTimeStr; 
		timeLabel = document.getElementById('time');
		timeLabel.textContent = dateTimeStr; 
  	 	
  	 	if(eventSliderOb.isSlidersLastSpot()) 
  	 		animForwardBtn.disabled = true;
  	 	else
  	 		animForwardBtn.disabled = false;
  	 		
  	 	if(eventSliderOb.isSlidersFirstSpot())
  	 		animBackwordBtn.disabled = true;
  	 	else
  	 		animBackwordBtn.disabled = false;  	
  }
  
  /***
   * Event Handler Listener function for when the Event Sliders Date Changes. 
   * We want to update our Animation Widgets Date to be the same as the Event Slider
   * Also Enable/Disable the Animation buttons depending on where we are at within the
   * Event Slider.  For example disable the Forward button when we are at the last event
   * within the map.
   */
  function updateMapTime()
  {
  	 if(eventSliderOb != null)
  	 {
        var dateTimeStr= eventSliderOb.getDateTimeInitialValue();
		
        var wmsLayer = esriMapOb.getWMSLayer();
		//Upate with date time parameter
		wmsLayer.paramsOb[timeDim] = dateTimeStr;
		wmsLayer.refresh();
		  	 	
  	 	updateAnimationWidget(dateTimeStr);
        
        if(eventSliderOb.getChartMode() != "timeMode")
        {
            dimSliderOb.removeChart();
            dimSliderOb.createDimensionalChart(eventSliderOb.getDateTime());
        }
  	 }
  }
  /**
 *Move the Event Slider to the next event. 
 */
function animationGoForward()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.moveSliderForward();
	}
}
/**
 *Move the Event Slider to the previous event. 
 */
function animationGoBackward()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.moveSliderBackward();
	}
}

/**
 *Animates through all the events.
 */
function animationPlay()
{
	if(eventSliderOb != null)
	{
		eventSliderOb.playButtonClicked();
		
		var playButton = document.getElementById('animPlayBtn');
		var img = playButton.children[0];
		
		
		if(eventSliderOb.isPlayActive())
			img.src = "./images/Button-Pause-16.png";
		else
			img.src = "./images/Button-Play-16.png";
		
	}
}

function gotNetCDFQueryResults()
{
    results = netCDFGPQueryOb.getResultsTable();
    timeField = netCDFGPQueryOb.getTimeField();
    valueField = netCDFGPQueryOb.getOutputValueField();

    var timeExtent = map.timeExtent;
    
	document.getElementById('eventSliderPanel').style.height = '190px';
    document.getElementById('timeSliderFooter').style.height = 'auto';
    
    document.getElementById('elevationSliderPanel').style.width = '275px';
    document.getElementById('leftChart').style.width = 'auto';
	//document.getElementById('panel').style.padding = '2px';
	//document.getElementById('panel').style.paddingTop = '10px';
    
    //Once we have the results we want to hide the loading image.
    //document.getElementById('loadingImg').hidden = true;
    eventSliderOb.setTimeField(timeField);
    eventSliderOb.setValueField(valueField);
    eventSliderOb.setPlotTable(results[0].features);
    eventSliderOb.removeChart();
    eventSliderOb.generateTimeGraph("0");
    
    dimSliderOb.setDimensionField("depth");
    dimSliderOb.setValueField(valueField);
    dimSliderOb.setTable(results[0].features);
    dimSliderOb.removeChart();
    dimSliderOb.createDimensionalChart(eventSliderOb.getDateTime());
    
}