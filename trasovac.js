var MapConstants = {
    DEFAULT_LATITUDE: 50.084218,
    DEFAULT_LONGITUDE: 14.441196,
    DEFAULT_ZOOM: 15,
    DEFAULT_MAP_TYPES: 'terrain',

}

var map = null;
var currentLatitude = MapConstants.DEFAULT_LATITUDE;
var currentLongitude = MapConstants.DEFAULT_LONGITUDE;



var initApp = function () {
    findPosition();
    var mapElement = document.getElementById('map');
    var mapOptions = {
        center: {
            lat: MapConstants.DEFAULT_LATITUDE,
            lng: MapConstants.DEFAULT_LONGITUDE,
        },
        zoom: MapConstants.DEFAULT_ZOOM,
        mapTypeId: MapConstants.DEFAULT_MAP_TYPES,
    };
    map = new google.maps.Map(mapElement, mapOptions);
    centerMap();
};
/*
vycentrovat mapu
*/
var centerMap = function () {
    map.setCenter(new google.maps.LatLng(parseFloat(currentLatitude), parseFloat(currentLongitude)));
};
// zjistit aktuální pozici
// nepůjde pokud nebudu na https
var findPosition = function () {
    // get current location
    // check if  Geolocation API is available
    if (!navigator.geolocation) {
        console.log('Geolocation API not available');
        // Geolocation API not available - use default
        currentLatitude = MapConstants.DEFAULT_LATITUDE;
        currentLongitude = MapConstants.DEFAULT_LONGITUDE;
        centerMap();
    } else {
        console.log('Geolocation API is available');
        // asynchronous
        navigator.geolocation.getCurrentPosition(function (position) {
                // Get the coordinates of the current possition.
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                centerMap();
            },
            // Optional error callback
            function (error) {
                alert('Position is unknown. It will be used a default one!')
                currentLatitude = MapConstants.DEFAULT_LATITUDE;
                currentLongitude = MapConstants.DEFAULT_LONGITUDE;
                centerMap();
            }
        );
    }
};
