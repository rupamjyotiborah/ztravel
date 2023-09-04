let baseURL = 'https://x8ki-letl-twmt.n7.xano.io/api:NqXBNLdv/';
let loginAPI = "";
$(document).ready(function() {
    let user,userID,userName;
    let token = localStorage.getItem('token');
    localStorage.setItem('source', "");
    localStorage.setItem('destination', "");
    $('#pac-input').val('');
    $('#pac-input1').val('');
    if(token == '' || token == undefined) {
        $('#loginUI').show();
        $('#maparea').hide();
        $('#customerUI').hide();
        $('#driverUI').hide();
        //$('#tripUI').hide();
    } 
    else if(token != '' && token != undefined) {
        $('#loginUI').hide();
        //$('#tripUI').hide();
        user = localStorage.getItem('user');
        //token = localStorage.getItem('token');
        if(user == 'customer') {
            userID = localStorage.getItem('customerID');
            userName = localStorage.getItem('name');
            $('#customername').text('Welcome '+userName);
            $('#driverUI').hide();
            $('#maparea').show();
            $('#customerUI').show();
        } else if(user == 'pilot') {
            userID = localStorage.getItem('driverID');
            userName = localStorage.getItem('name');
            $('#drivername').text('Welcome '+userName);
            $('#customerUI').hide();
            $('#driverUI').show();
        } 
    }
});

$('#login').on('click', function(e) {
    e.preventDefault();
    let pos = {};
    let user = $('#user').val();
    let contact_no = $('#contact_no').val();
    let password = $('#password').val();
    let fd = new FormData();
    fd.append('contact_no', contact_no);
    fd.append('password', password);
    if(user == 'customer'){
        loginAPI = baseURL+'customer/auth/login';
    } else if(user == 'pilot') {
        loginAPI = baseURL+'driver/auth/login';
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    localStorage.setItem('pilot_loc', JSON.stringify(pos));
                },
            );
        } else {
            alert('Location not defined')
        }
        let pilot_loc = localStorage.getItem('pilot_loc');
        fd.append('current_loc',pilot_loc);
    }
    $.ajax({
        url : loginAPI,
        type : 'POST',
        processData: false,
        contentType: false,
        data : fd,
        success : function(resp) {
            $('#loginUI').hide();
            localStorage.setItem('token', resp.token);
            localStorage.setItem('user', resp.user);
            if(resp.user == 'customer'){ 
                localStorage.setItem('customerID', resp.customerID);
                localStorage.setItem('name', resp.name);
                $('#customername').text('Hi '+resp.name);
                $('#maparea').show();
                $('#customerUI').show();
            } else if(resp.user == 'pilot') {
                localStorage.setItem('driverID', resp.driver_info.id);
                localStorage.setItem('driverName', resp.driver_info.name);
                $('#driverUI').show();
            }
        },
    });
});

$('#confirmbutton').on('click', function() {
    //console.log('Clicked');
    let source = localStorage.getItem('source');
    let source_loc = JSON.parse(source);
    let token = localStorage.getItem('token');
    //console.log(source_loc.lat);
    //console.log(source_loc.lng);
    let coordinates = new FormData();
    coordinates.append('lat', source_loc.lat);
    coordinates.append('lng', source_loc.lng);
    //console.log(coordinates);
    let locations = [];
    $.ajax({
        url : baseURL+'driver/active/loggedin/getlocations',
        type : 'POST',
        processData: false,
        contentType: false,
        data : coordinates,
        headers: { 'Authorization': 'Bearer '+token },
        success: function(resp) {
            console.log(resp.near_by_drivers);
            let drivers = resp.near_by_drivers;
            //console.log(drivers);
            showActivePilots(drivers);
            $('#confirmbtn').hide();
            $('#connectingpilot').show();
            sendNotificationAndFindPilot(drivers);
        },
        error: function(err) {
            console.log(err);
        },
    });
});

function sendNotificationAndFindPilot(drivers) {
    //let customerId = localStorage.
    let token = localStorage.getItem('token');
    let driverids = [];
    for(let i=0; i<drivers.length; i++) {
        driverids.push(drivers[i][0]);
    }
    $.ajax({
        url : baseURL+'driver/send/notification',
        type : 'POST',
        dataType : 'json',
        data: JSON.stringify({ driverids }),
        contentType: "application/json; charset=utf-8",
        headers: { 'Authorization': 'Bearer '+token },
        success: function(resp) {
            console.log(resp.d);
            getConfirmationFromPilot(driverids);
        },
        error: function(err) {
            console.log(err);
        },
    });
}

function getConfirmationFromPilot(driverids) {
    let token = localStorage.getItem('token');
    const intervalId = setInterval(() => {
        $.ajax({
            url : baseURL+'driver/get/confirmation',
            type : 'POST',
            dataType : 'json',
            data: JSON.stringify({ driverids }),
            contentType: "application/json; charset=utf-8",
            headers: { 'Authorization': 'Bearer '+token },
            success: function(resp) {
                console.log(resp);
                if(resp.flag == 1) {
                    clearInterval(intervalId);
                    let customerId = localStorage.getItem('customerID');
                    let source_latlong = localStorage.getItem('source');
                    let destination_latlong = localStorage.getItem('destination');
                    let destination_address = localStorage.getItem('destination_address');
                    let source_address = localStorage.getItem('source_address');
                    let estimated_fare = localStorage.getItem('estimated_fare');
                    saveTripData(customerId,resp.id,source_latlong,destination_latlong,destination_address,source_address,estimated_fare,resp);
                    //console.log(resp);
                }                
            },
            error: function(err) {
                console.log(err);
            },
        });
    }, 3000);    
}

function saveTripData(customer_id,driver_id,pick_coordinate,drop_coordinate,drop_loc,pic_up_loc,estimated_fare,driverInfo) {
    //console.log(typeof(pic_up_loc));
    //console.log(typeof(drop_loc));
    let token = localStorage.getItem('token');
    let td = new FormData();
    td.append('customer_id',customer_id);
    td.append('driver_id',driver_id);
    td.append('pick_coordinate',pick_coordinate);
    td.append('drop_coordinate',drop_coordinate);
    td.append('drop_loc',JSON.stringify(drop_loc));
    td.append('pic_up_loc',JSON.stringify(pic_up_loc));
    td.append('estimated_fare',estimated_fare);
    $.ajax({
        url : baseURL+'travel_data/create/',
        type : 'POST',
        processData: false,
        contentType: false,
        data: td,
        headers: { 'Authorization': 'Bearer '+token },
        success: function(resp) {
            //console.log(resp);
            //console.log(driverInfo);
            let content = driverInfo.vehicle_reg_no+'<br />';
            content += driverInfo.vehicle_model+'<br />';
            content += driverInfo.vehicle_color+'<br />';
            $('#pilotname').text(driverInfo.name);
            $('#contact').text('Call : '+driverInfo.contact_no);
            $('#vehicleinfo').html(content);
            $('#rating').text('Rating : ' +driverInfo.rating);
            $('#otp').text('OTP : '+resp.trip_data.otp);
            $('#tripid').text('Trip # : '+resp.trip_data.id);
            $('#connectingpilot').hide();
            $('#pilotinfo').show();
            showCustomerAndPilotLocs(driverInfo.current_loc.data,pick_coordinate);
        },
        error: function(err) {
            console.log(err);
        },
    });
}

function showCustomerAndPilotLocs(driverLoc, customerLoc) {
    customerLoc = JSON.parse(customerLoc);
    console.log(customerLoc);
    console.log(driverLoc);
    let map;
    let bounds = new google.maps.LatLngBounds();
    let mapOptions = {
        mapTypeId: 'roadmap',
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    //gmap.setTilt(45); 
    let marker = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    marker.setVisible(false);
    // If the place has a geometry, then present it on a map.    
    map.setCenter(customerLoc);
    map.setZoom(14);    
    marker.setPosition(customerLoc);
    marker.setVisible(true);
    
    let marker1 = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    marker1.setVisible(false);
    // If the place has a geometry, then present it on a map.    
    map.setCenter(driverLoc);
    map.setZoom(10);    
    marker1.setPosition(driverLoc);
    marker1.setVisible(true); 
    calculateDistance(JSON.stringify(driverLoc),JSON.stringify(customerLoc),map);
    // const service = new google.maps.DistanceMatrixService();
    // const request = {
    //     origins: [driverLoc],
    //     destinations: [customerLoc],
    //     travelMode: google.maps.TravelMode.DRIVING,
    //     unitSystem: google.maps.UnitSystem.METRIC,
    //     avoidHighways: false,
    //     avoidTolls: false,
    // };
    // service.getDistanceMatrix(request).then((response) => {
    //     showPath(driverLoc,customerLoc,map);
    //     let km = Math.ceil(Number(response.rows[0].elements[0].distance.value) / 1000);
    //     console.log('KM : '+response.rows[0].elements[0].distance.value);
    // });
}

function showActivePilots(driverLoc) {
    let gmap;
    let bounds = new google.maps.LatLngBounds();
    let mapOptions = {
        mapTypeId: 'roadmap'
    };
    gmap = new google.maps.Map(document.getElementById("map"), mapOptions);
    gmap.setTilt(45); 
    let marker, i;     
    for( i = 0; i < driverLoc.length; i++ ) {
        let position = new google.maps.LatLng(driverLoc[i][1], driverLoc[i][2]);
        bounds.extend(position);
        marker = new google.maps.Marker({
            position: position,
            map: gmap,
            animation: google.maps.Animation.DROP,
            title: 'P'+(i+1)
        });
        gmap.fitBounds(bounds);
    }
    let boundsListener = google.maps.event.addListener((gmap), '', function(event) {
        this.setZoom(15);
        google.maps.event.removeListener(boundsListener);
    });
}

function initMap() {
    let map, infoWindow,initialMapMarker;
    const geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.749933, lng: -73.98633 },
        zoom: 14,
        disableDefaultUI: true,
    });
    const shape = {
        coords: [1, 1, 1, 20, 18, 20, 18, 1],
        type: "poly",
    };
    infoWindow = new google.maps.InfoWindow();
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                localStorage.setItem('source', JSON.stringify(pos));
                map.setZoom(14);
                map.setCenter(pos);
                map.setOptions({ styles: [
                        {
                            featureType: "poi.business",
                            stylers: [{ visibility: "off" }],
                        },
                        {
                            featureType: "transit",
                            elementType: "labels.icon",
                            stylers: [{ visibility: "off" }],
                        },
                    ] 
                });
                let icon = {
                    url: "icons/pin.png",
                    scaledSize: new google.maps.Size(40, 40),
                };
                initialMapMarker = new google.maps.Marker({
                    position: { lat: position.coords.latitude, lng: position.coords.longitude },
                    map,
                    animation: google.maps.Animation.DROP,
                    icon: icon,
                });
                geocoder.geocode({ location: pos })
                .then((response) => {
                if(response.results[0]) {
                    localStorage.setItem('source_address',response.results[0].formatted_address);
                } else {
                    window.alert("No results found");
                }
                })
                .catch((e) => window.alert("Geocoder failed due to: " + e));
            },
            () => {
                handleLocationError(true, infoWindow, map.getCenter());
            }
        );
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }

    const card = document.getElementById("pac-card");
    const input = document.getElementById("pac-input");
    const options = {fields: ["formatted_address", "geometry", "name"],strictBounds: false,types: ["establishment"],};
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
    const autocomplete = new google.maps.places.Autocomplete(input,options);  
    autocomplete.bindTo("bounds", map);
    //infoWindow = new google.maps.InfoWindow();
    const infowindowContentSource = document.getElementById("infowindow-content-source");
    //const marker = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    let sourceIcon = {url: "icons/pin.png",scaledSize: new google.maps.Size(40, 40),};
    const sourceMarker = new google.maps.Marker({map,animation: google.maps.Animation.DROP,icon: sourceIcon,});
    autocomplete.addListener("place_changed", () => {
        initialMapMarker.setMap(null);
        infoWindow.close();
        sourceMarker.setVisible(false);
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }
        if(place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(13);
        }
        sourceMarker.setPosition(place.geometry.location);
        //sourceMarker.setMap(null);
        sourceMarker.setVisible(true);
        infowindowContentSource.children["locsource"].textContent = 'Pick Up Location';
        infowindowContentSource.children["place-address-source"].textContent = place.formatted_address;
        infoWindow.setContent(infowindowContentSource);
        //infoWindow.open(map, sourceMarker);
        localStorage.setItem('source', JSON.stringify(place.geometry.location));
        localStorage.setItem('source_address', place.formatted_address);
        let sourceData = localStorage.getItem('source');
        let destinationData = localStorage.getItem('destination');
        //console.log(destinationData);
        if(destinationData != "") {
            calculateDistance(sourceData,destinationData,map);
        }
    });

    const input1 = document.getElementById("pac-input1");
    const options1 = {fields: ["formatted_address", "geometry", "name"],strictBounds: false,types: ["establishment"],};
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
    const autocomplete1 = new google.maps.places.Autocomplete(input1,options1);  
    autocomplete1.bindTo("bounds", map);
    //infoWindow = new google.maps.InfoWindow();
    const infowindowContentDest = document.getElementById("infowindow-content-dest");
    infoWindow.setContent(infowindowContentDest);
    //const marker1 = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    let destIcon = {url: "icons/pin.png",scaledSize: new google.maps.Size(40, 40),};
    const destinationMarker = new google.maps.Marker({map,animation: google.maps.Animation.DROP,icon: destIcon,});
    autocomplete1.addListener("place_changed", () => {
        initialMapMarker.setMap(null);
        infoWindow.close();
        destinationMarker.setVisible(false);
        const place1 = autocomplete1.getPlace();
        if (!place1.geometry || !place1.geometry.location) {
            window.alert("No details available for input: '" + place1.name + "'");
            return;
        }
        // If the place has a geometry, then present it on a map.
        if (place1.geometry.viewport) {
            map.fitBounds(place1.geometry.viewport);
        } else {
            map.setCenter(place1.geometry.location);
            map.setZoom(13);
        }
        destinationMarker.setPosition(place1.geometry.location);
        //destinationMarker.setMap(null);
        destinationMarker.setVisible(true);
        infowindowContentDest.children["locdest"].textContent = 'Drop Location';
        infowindowContentDest.children["place-address-dest"].textContent = place1.formatted_address;
        infoWindow.setContent(infowindowContentDest);
        //infoWindow.open(map, destinationMarker);
        localStorage.setItem('destination', JSON.stringify(place1.geometry.location));
        localStorage.setItem('destination_address', place1.formatted_address);
        let sourceData = localStorage.getItem('source');
        let destinationData = localStorage.getItem('destination');
        calculateDistance(sourceData,destinationData,map);
    });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function calculateDistance(sourceData, destinationData,map) {    
    let token = localStorage.getItem('token');
    const service = new google.maps.DistanceMatrixService();
    const origin = JSON.parse(sourceData);
    const destination = JSON.parse(destinationData);
    const request = {
        origins : [origin],
        destinations : [destination],
        travelMode : google.maps.TravelMode.DRIVING,
        unitSystem : google.maps.UnitSystem.METRIC,
        avoidHighways : false,
        avoidTolls : false,
    };
    showPath(origin,destination,map);
    service.getDistanceMatrix(request).then((response) => {        
        $.ajax({
            url : baseURL+'fare/customer/all/fares',
            type : 'GET',
            headers: { 'Authorization': 'Bearer '+token },
            success: function(resp) {
                //console.log(resp.fares[0]);
                let km = Math.ceil(Number(response.rows[0].elements[0].distance.value) / 1000);
                let total_fare = (km * resp.fares[1].value) + resp.fares[0].value;
                localStorage.setItem('estimated_fare', total_fare);
                $('#estimatedText').text('Estimated Fare : '+total_fare);
                $('#confirmbtn').show();
            },
            error: function(err) {
                console.log(err);
            },
        });
    });
}

function showPath(start,end,map) {
    map.setOptions({ styles: [
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "transit",
                elementType: "labels.icon",
                stylers: [{ visibility: "off" }],
            },
        ] 
    });
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();
    directionsRenderer.setMap(map);
    calculateAndDisplayRoute(directionsService,directionsRenderer,start,end);
}

function calculateAndDisplayRoute(directionsService, directionsRenderer, start, end) {
    directionsService
    .route({ origin: start, destination: end,  travelMode: 'DRIVING',})
    .then((response) => {
      directionsRenderer.setDirections(response);
    })
    .catch((e) =>
      window.alert("Directions request failed")
    );
}

window.initMap = initMap;