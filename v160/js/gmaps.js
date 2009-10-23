var gmap_data;
function GMapApp(div_id) {

	this.baseIcon = new GIcon();

	this.baseIcon.shadow = "http://www.google.com/mapfiles/shadow50.png";
	this.baseIcon.iconSize = new GSize(20, 34);
	this.baseIcon.shadowSize = new GSize(37, 34);
	this.baseIcon.iconAnchor = new GPoint(9, 34);
	this.baseIcon.infoWindowAnchor = new GPoint(9, 2);
	this.baseIcon.infoShadowAnchor = new GPoint(18, 25);

	this.myMap = null;
	this.markerList = new Array();

    // create a map
	this.myMap = new GMap2($i(div_id));
	this.myMap.addControl(new GLargeMapControl());
	this.myMap.addControl(new GMapTypeControl());
	this.myMap.setCenter(new GLatLng(22.100000,78.962880), 4);

	// Create a search control
	var searchControl = new GSearchControl();

	// Add in a full set of searchers
	var localSearch = new GlocalSearch();
	searchControl.addSearcher(localSearch);

	// Set the Local Search center point
	localSearch.setCenterPoint(this.myMap);

	// tell the searcher to draw itself and tell it where to attach
    searchControl.draw();

	// tell the search control to call be on start/stop
	searchControl.setSearchCompleteCallback(this, GMapApp.prototype.OnSearchComplete);
	searchControl.setOnKeepCallback(this, GMapApp.prototype.OnKeep, "view on map");

	// execute an inital search
	for (var i=0 ; i<gmap_data.length ; i++){
		//alert("fname" + i)
		searchControl.execute(gmap_data[i].name);
	}
}

GMapApp.prototype.OnSearchComplete = function(sc, searcher) {
	//alert("OnSearchComplete")
	// if we have local search results, put them on the map
	if ( searcher.results && searcher.results.length > 0) {
		for (var i = 0; i < searcher.results.length; i++) {
			var result = searcher.results[i];

			// if this is a local search result, then proceed...
			if (result.GsearchResultClass == GlocalSearch.RESULT_CLASS ) {
				var markerObject = new Object();
				var letteredIcon = new GIcon(this.baseIcon);

				// here add codition to define color of ballon
				letteredIcon.image = "http://labs.google.com/ridefinder/images/mm_20_"+data[id].color+".png"
				markerOptions = { icon:letteredIcon };

				markerObject.result = result;
				markerObject.contain = gmap_data[id].box_html;

				markerObject.latLng = new GLatLng(parseFloat(result.lat), parseFloat(result.lng));

				markerObject.gmarker = new GMarker(markerObject.latLng,markerOptions);
				var clickHandler = method_closure(this, App.prototype.OnMarkerClick, [markerObject]);
				
				GEvent.bind(markerObject.gmarker, "click", this, clickHandler);
				this.markerList.push(markerObject);
				this.myMap.addOverlay(markerObject.gmarker);
				result.__markerObject__ = markerObject;
			}
		}
		this.OnMarkerClick(this.markerList[0]);
		id +=1;
	}
}

GMapApp.prototype.OnKeep = function(result) {
	//alert("OnKeep")
	if (result.__markerObject__) {
		markerObject = result.__markerObject__;
		this.OnMarkerClick(markerObject);
	}
}

GMapApp.prototype.OnMarkerClick = function(markerObject) {
	//alert("OnMarkerClick")
	this.myMap.closeInfoWindow();
	markerObject.gmarker.openInfoWindowHtml(markerObject.contain);
}

function method_closure(object, method, opt_argArray) {
	//alert("method_closure")
	return function() {
		return method.apply(object, opt_argArray);
	}
}