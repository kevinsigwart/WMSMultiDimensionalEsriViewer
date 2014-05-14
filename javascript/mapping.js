dojo.require("dojo.DeferredList");

//Global Variables
var map = null;
var transectFeatures = [];
var gpTask = "";
var geomService = "";
var resultTables = [];
var wmsMultiDimLayer = null;
var wmsAddedToMapEvent;



function esriMap(esrimap,wmsService){
	
	map = esrimap;
			    
    //Methods
	this.clearGraphics = esriMapClearGraphics;
	//this.removeSelections = esriMapRemoveSelections;
	this.addPointToMap = esriMapAddPointToMap;
	this.UpdateMapTime = esriMapUpdateTimeExtent;
    this.getWMSLayer = esriMapGetWMSLayer;
    
    wmsMultiDimLayer = new WMSLayerWithTime(wmsService);
    
    //Event Listeners
    document.addEventListener("WMSDimensionsLoaded",wmsLoaded,false);		
}

function esriMapGetWMSLayer(){
    return wmsMultiDimLayer;
}

/**
 *Once the WMS has been parsed and ready to load we can let the user
 * know which layers and dimensions can be displayed
 */
function wmsLoaded()
{
	//Set Initial Values
	var subLayers = wmsMultiDimLayer.getSubLayerWDim();
    var selLayer = subLayers[0];
	if(subLayers.length > 0)
	{
       wmsMultiDimLayer.initializeDimensionParams(selLayer);
	   map.addLayer(wmsMultiDimLayer);
       
	   //Events
       wmsAddedToMapEvent = document.createEvent("Event");
       //We need to let the mapping client know when a point has been selected on the map
       wmsAddedToMapEvent.initEvent("WMSAddedToMapEvent",true,true);	
       document.dispatchEvent(wmsAddedToMapEvent);
	}
	else
	{
		alert("Web Map Service loaded does not have any multi-dimensional layers contained within it.");
	}
}



/**************** Chart Events ******************************************/
/**
 *When the Chart Point is selected we want to select the graphic on the map 
 */
function graphSelectIndexChanged () {
	
  var selIndex = chart.getSelectedGraphIndex();
  esriMapSelectGraphic(selIndex);
}


/************** Time Change Functions ***********************************/
/**
 *When we change the time (or want to redraw the chart based on updated parameters)
 * we fire off this method 
 */
function esriMapTimeExtentChange()
{
	var index = chart.getSelectedGraphIndex();
	if(index == -1)
		index = 0;
		
	esriMapUpdateChartTime(index);
}

/**
 * When the time extent on the map changes we need to update the Kisters chart to highlight it on
 * their chart.  Our data is summerized by month and their data is in 3 hour increments, so we highlight
 * the entire month. 
 * @param {Object} dateTime
 */
function esriMapUpdateTimeExtent(dateTime)
{
	var timeExtent = new esri.TimeExtent();
	timeExtent.startTime = dateTime;
	map.setTimeExtent(timeExtent); 
}  


/**
 *Clears out the map graphics, removes the chart and sets variables to default values 
 */
function esriMapClearGraphics() {

	map.graphics.clear();  

}



/*****  Time Series Point Plot *******************************************************/
/*
 * Plots the points values over time
 */
function esriMapAddPointToMap(geometry)
{
  	var symbol = new esri.symbol.SimpleMarkerSymbol();	    
    symbol.setSize(12);
    symbol.setOutline(new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0,0,0]), 1));
    //symbol.setColor(new dojo.Color([255,0,0,0.75]));
    symbol.setColor(new dojo.Color([0,255,255,0.75]));
    
    var graphic = new esri.Graphic(geometry,symbol);
    
    map.graphics.clear();
    
    map.graphics.add(graphic);
    
    map.centerAt(geometry);
}