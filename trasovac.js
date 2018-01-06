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
        MIN_TRACK_POINT_DELTA: 0.0001,

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

    var showTrack = function (track, data) {
        var pointarray = [];
        // process first point
        var lastlat = parseFloat(track.points[0].lat);
        var lastlon = parseFloat(track.points[0].long);
        var latlng = new google.maps.LatLng(lastlat, lastlon);
        pointarray.push(latlng);
        for (var i = 1; i < track.points.length; i++) {
            var lat = parseFloat(track.points[i].lat);
            var lon = parseFloat(track.points[i].long);
            // Verify that this is far enough away from the last point to be used.
            var latdiff = lat - lastlat;
            var londiff = lon - lastlon;
            if (Math.sqrt(latdiff * latdiff + londiff * londiff) >
                MapConstants.MIN_TRACK_POINT_DELTA) {
                lastlon = lon;
                lastlat = lat;
                latlng = new google.maps.LatLng(lat, lon);
                pointarray.push(latlng);
            }
        }

        var path = new google.maps.Polyline({
            path: pointarray,
            geodesic: true,
            strokeColor: MapConstants.STROKE_COLOR_DEFAULT,
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        path.setMap(map);
        track.latlngArray = pointarray;
        track.polyline = path;
        // click track on the map - color all tracks as default
        // and color clicked track as selected
        google.maps.event.addListener(track.polyline, 'click', function () {
            unselectTracks(data, MapConstants.STROKE_COLOR_DEFAULT);
            track.polyline.setMap(null);
            track.polyline.setMap(map);
            showElevation(track);
        });
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

    var centerAndZoomMap = function (data) {

        var minlat = data.minLatitude;
        var maxlat = data.maxLatitude;
        var minlon = data.minLongitude;
        var maxlon = data.maxLongitude;

        if ((minlat === -1) && (maxlat == -1)) {
            centerMap();
            return;
        }

        // Center around the middle of the points
        var centerlon = (maxlon + minlon) / 2;
        var centerlat = (maxlat + minlat) / 2;
        //zoom
        var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(minlat, minlon),
            new google.maps.LatLng(maxlat, maxlon));
        map.setCenter(new google.maps.LatLng(centerlat, centerlon));
        map.fitBounds(bounds);
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

        },

        showOnMap: function (tracks, data) {
            centerAndZoomMap(data);
            for (var i = 0; i < tracks.length; i++) {
                showTrack(tracks[i], data);
            }
            if (data.gpxs.length > 0 && data.gpxs[0].tracks.length > 0) {
                //showElevation(data.gpxs[0].tracks[0]);
            }
            console.log("hotovo");
        },


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


        showDragError: function (message) {
            var element;
            element = document.getElementById('drop_zone_error');
            element.innerHTML = message;
            // Add the "show" class to DIV
            element.className = "show";

            setTimeout(function () {
                element.className = element.className.replace("show", "");
            }, 3000);
        },
    }



})();


/*
  --------------------------------------------------------
  ---------------------- DataController ------------------
  --------------------------------------------------------
*/
var DataController = (function () {

    var data = {
        gpxs: [],
        minLatitude: -1,
        maxLatitude: -1,
        minLongitude: -1,
        maxLongitude: -1,
    }

    // Gpx file can contain more tracks 

    var Gpx = function (id, name, filename) {
        this.id = id;
        this.name = name;
        this.filename = filename;
        this.tracks = new Array();
    };

    Gpx.prototype.addTrack = function (track) {
        this.tracks.push(track);
    };


    // track with points
    var Track = function (id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.points = new Array();
        this.latlngArray = [];
        this.polyline = null;
        this.isPloted = false;
    };

    // point with latitude and longitude
    var Point = function (lat, long) {
        this.lat = lat;
        this.long = long;
    };

    Track.prototype.addPoint = function (point) {
        this.points.push(point);
    };


    var calculateBounds = function () {
        var track, gpx;
        var minlat = 999999999;
        var maxlat = -99999999999;
        var minlon = 999999999;
        var maxlon = -99999999999;
        if (data.gpxs.length == 0) {
            data.minLatitude = -1;
            data.maxLatitude = -1;
            data.minLongitude = -1;
            data.maxLongitude = -1;
            return;
        }

        for (var i = 0; i < data.gpxs.length; i++) {
            gpx = data.gpxs[i];
            for (var j = 0; j < gpx.tracks.length; j++) {
                track = gpx.tracks[j];
                for (var k = 1; k < track.points.length; k++) {
                    var lat = parseFloat(track.points[k].lat);
                    var lon = parseFloat(track.points[k].long);
                    if (lon < minlon) minlon = lon;
                    if (lon > maxlon) maxlon = lon;
                    if (lat < minlat) minlat = lat;
                    if (lat > maxlat) maxlat = lat;
                }
            }
        }
        data.minLatitude = minlat;
        data.maxLatitude = maxlat;
        data.minLongitude = minlon;
        data.maxLongitude = maxlon;
    }

    var getTrackCount = function () {
        var counter = 0;
        for (var i = 0; i < data.gpxs.length; i++) {
            counter += data.gpxs[i].tracks.length;
        }
        return counter;
    }


    var filterGpxFiles = function (files) {
        var gpxFiles = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].name.split('.').pop().toLowerCase() === 'gpx') {
                gpxFiles.push(files[i]);
            }
        }
        return gpxFiles;
    };

    var readTrack = function (xmlTrack, gpx) {
        var name, id, color, track, xmlPoints;

        name = $(xmlTrack).find("name").text();
        id = getTrackCount();
        if (!name) {
            name = 'track' + (id + 1);
        }

        // track color from gsx file
        color = $(xmlTrack).find("color").text();
        track = new Track(id, name, color);

        var xmlPoints = $(xmlTrack).find("trkpt");
        for (var i = 0; i < xmlPoints.length; i++) {
            // have to be wrapped by $() to use attr fuction of jquery
            var lat = $(xmlPoints[i]).attr('lat');
            var lon = $(xmlPoints[i]).attr('lon');
            point = new Point(lat, lon);
            track.addPoint(point);
        }
        // register tracks if there are some points
        if (track.points.length > 0) {
            gpx.addTrack(track);
        }
    }


    var readGpxFiles = function (file, callBackShowOnMap) {
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
            // do dat jeden prazdny gpx
            gpx = new Gpx(data.gpxs.length + 1, name, file.name);
            data.gpxs.push(gpx);

            tracksXml = $(xmlData).find("trk");
            for (var i = 0; i < tracksXml.length; i++) {
                readTrack(tracksXml[i], gpx);
            }

            if (tracksXml.length > 0) {
                // after the reading odf file is done the callback
                // function is called
                calculateBounds();

            }

            callBackShowOnMap(gpx.tracks, data);

        };
    };

    /*
    --------------------- Return part ---------------------
    */
    return {




        parseFiles: function (files, callBackShowOnMap) {
            var gpxFiles;
            // 1. filter only gpx files 
            gpxFiles = filterGpxFiles(files);

            if (gpxFiles.length > 0) {

                // Checks whether the browser supports HTML5  
                if (typeof (FileReader) != "undefined") {
                    // 5. read GPX files as XML
                    for (var i = 0; i < gpxFiles.length; i++) {
                        readGpxFiles(files[i], callBackShowOnMap);
                        console.log(data);
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
var MainController = (function (mapCtrl, UICtrl, dataCtrl) {


    var setupEventListeners = function () {

        document.getElementById("gpxFile").addEventListener("change", buttonFilesClick, false);

    };

    var buttonFilesClick = function (evt) {
        var selectedFiles = UICtrl.selectFiles(evt);
        if (dataCtrl.parseFiles(files, showOnMap) === 0) {
            UICtrl.showDragError('No gpx file selected...');
        }
    }

    var showOnMap = function (tracks, data) {
        if (tracks.length > 0) {
            mapCtrl.showOnMap(tracks, data);
        } else {
            UICtrl.showDragError("No track found in gpx...");
        }
    };

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
