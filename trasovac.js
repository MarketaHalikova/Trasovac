/*
  --------------------------------------------------------
  ---------------------- MapController ------------------
  --------------------------------------------------------
*/
var MapController = (function () {


    var MapConstants = {
        DEFAULT_LATITUDE: 50.084218,
        DEFAULT_LONGITUDE: 14.441196,
        DEFAULT_ZOOM: 15,
        DEFAULT_MAP_TYPES: 'terrain',

    }

    var map = null;
    var currentLatitude = MapConstants.DEFAULT_LATITUDE;
    var currentLongitude = MapConstants.DEFAULT_LONGITUDE;


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

    /*
    --------------------- Return part ---------------------
    */
    return {

        init: function (google) {

            var mapElement, mapOptions

            findPosition();

            mapElement = document.getElementById('map');
            mapOptions = {
                center: {
                    lat: MapConstants.DEFAULT_LATITUDE,
                    lng: MapConstants.DEFAULT_LONGITUDE,
                },
                zoom: MapConstants.DEFAULT_ZOOM,
                mapTypeId: MapConstants.DEFAULT_MAP_TYPES,
            };
            map = new google.maps.Map(mapElement, mapOptions);

            centerMap();
        }
    }

})();


/*
  --------------------------------------------------------
  ---------------------- UIController ------------------
  --------------------------------------------------------
*/
var UIController = (function () {


    /*
    --------------------- Return part ---------------------
    */
    return {

        selectFiles: function (evt) {
            var element = evt.target;
            files = [];
            for (var i = 0; i < element.files.length; i++) {
                files.push(element.files[i]);
            }
            return files;
        },
    }

})();


/*
  --------------------------------------------------------
  ---------------------- DataController ------------------
  --------------------------------------------------------
*/
var DataController = (function () {


    var filterGpxFiles = function (files) {
        var gpxFiles = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.split('.').pop().toLowerCase() === 'gpx') {
                gpxFiles.push(files[i]);
            }
        }
        return gpxFiles;
    };

    var readGpxFiles = function (file) {
        var reader,
            reader = new FileReader();
        reader.readAsText(file);
        // callback function is called when the file is readed
        reader.onloadend = function () {
            var xmlData, tracks, track, name;
            xmlData = $(reader.result);
            name = $(xmlData).find("metadata").find('name').text();
            if (!name) {
                name = file.name;
            }
        };
    };

    /*
    --------------------- Return part ---------------------
    */
    return {




        parseFiles: function (files) {
            var gpxFiles;
            // 1. filter only gpx files 
            gpxFiles = filterGpxFiles(files);

            if (gpxFiles.length > 0) {

                // Checks whether the browser supports HTML5  
                if (typeof (FileReader) != "undefined") {
                    // 5. read GPX files as XML
                    for (var i = 0; i < gpxFiles.length; i++) {
                        readGpxFiles(files[i]);
                    }
                } else {
                    alert("Sorry! Your browser does not support HTML5!");
                }
            }
            return gpxFiles.length;
        },
    }

})();


/*
  --------------------------------------------------------
  ---------------------- MainController ------------------
  --------------------------------------------------------
*/
var MainController = (function (mapCtrl, uICtrl, dataCtrl) {


    var setupEventListeners = function () {

        document.getElementById("gpxFile").addEventListener("change", buttonFilesClick, false);

    };

    var buttonFilesClick = function (evt) {
        var selectedFiles = uICtrl.selectFiles(evt);
        dataCtrl.parseFiles(selectedFiles);
        //if (dataCtrl.parseFiles(files, showOnMap) === 0) {
        //     UICtrl.showDragError('No gpx file selected...');
        // }
    }

    /*
    --------------------- Return part ---------------------
    */


    return {
        init: function (google) {
            setupEventListeners();
            mapCtrl.init(google);

        }

    }

})(MapController, UIController, DataController);



var initApp = function () {
    MainController.init(google);
};
