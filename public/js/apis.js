let baseURL = 'https://x8ki-letl-twmt.n7.xano.io/api:NqXBNLdv/';
let loginAPI = "";

$(document).ready(function() {
    let user,userID,userName;
    let token = localStorage.getItem('token');
    $('#pac-input').val('');
    $('#pac-input1').val('');
    if(token == '' || token == undefined) {
        $('#loginUI').show();
        $('#maparea').hide();
        $('#mapUI').hide();
    } 
    else if(token != '' && token != undefined) 
    {
        $('#loginUI').hide();
        $('#tripUI').hide();
        $('#billarea').hide();
        user = localStorage.getItem('user');
        if(user == 'customer') {
            localStorage.setItem('source', "");
            localStorage.setItem('destination', "");
            userID = localStorage.getItem('customerID');
            userName = localStorage.getItem('name');
            $('#username').text('Welcome '+userName);
            $('#pac-container').show();
        } else if(user == 'pilot') 
        {
            let driver_id = localStorage.getItem('driverID');
            let source = localStorage.getItem('source');
            let destination = localStorage.getItem('destination');
            if(destination != "") {
                showCustomerLocLineFromDriver(JSON.parse(source),destination,"ABC");
            }
            userName = localStorage.getItem('name');
            $('#username').text('Welcome '+userName);
            $('#pac-container').hide();
            //timelyPilotLocationUpdater();
            $.ajax({
                url : baseURL+'driver/check/assignments/'+driver_id,
                type : 'GET',
                headers : { 'Authorization' : 'Bearer '+token, },
                success : function(resp) {
                    if(resp.driver_data[0].logged_in == 1 && resp.driver_data[0].riding == 0 && resp.driver_data[0].assign_ride == 1 && 
                        resp.driver_data[0].accept_ride == 0){
                        checkForAssignment();         
                    }
                },
                error : function(error) {
                    console.log('Something went wrong '+error);
                },
            });
        }
        $('#maparea').show();
        $('#mapUI').show();
    }
});

$('#login').on('click', function(e) {
    e.preventDefault();
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
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    localStorage.setItem('pilot_loc', JSON.stringify(pos));
                },
            );
        } else {
            alert('Location not defined')
        }
    }
    let flag = 0;
    $.ajax({
        url : loginAPI,
        type : 'POST',
        processData: false,
        contentType: false,
        data : fd,
        success : function(resp) {
            flag = 1;
            localStorage.setItem('token', resp.token);
            localStorage.setItem('user', resp.user);
            if(resp.user == 'customer'){ 
                localStorage.setItem('name', resp.name);
                localStorage.setItem('customerID', resp.customerID);
                $('#username').text('Hi '+resp.name);
                $('#loginUI').hide();
                $('#maparea').show();
                $('#mapUI').show();
            } else if(resp.user == 'pilot') {
                localStorage.setItem('driverID', resp.driver_id);
                localStorage.setItem('name', resp.driver_name);
                $('#username').text('Hi '+resp.driver_name);
                $('#pac-container').hide();
                console.log(resp.driver_id);
                updatePilotLoc(resp.driver_id);
                $('#loginUI').hide();
                $('#maparea').show();
                $('#mapUI').show();
                //timelyPilotLocationUpdater();
                checkForAssignment();
            }
        },
        error : function(error) {
            console.log('Something went wrong : '+error);
        },
    });
});

function checkForAssignment() {
    let driver_id = localStorage.getItem('driverID');
    let token = localStorage.getItem('token');
    let fd = new FormData();
    const driverAssigmentCheckId = setInterval(() => {
        $.ajax({
            url : baseURL+'driver/fetch/assignments/'+driver_id,
            type : 'GET',
            processData: false,
            contentType: false,
            //data : fd,
            headers : {
                'Authorization' : 'Bearer '+token,
            },
            success : function(resp) {
                if(resp.driver.length == 0){
                    console.log('No Notification');
                } else {
                    clearInterval(driverAssigmentCheckId);
                    $('#accept').attr('driverId', driver_id);
                    $('#reject').attr('driverId', driver_id);
                    $("#notificationModal").modal('show');
                }
            },
            error : function(error) {
                console.log('Notification not found');
            },
        });
    }, 10000);    
}

$('#accept').on('click', function() {
    $("#notificationModal").modal('hide');
    let driver_id = $(this).attr('driverId');
    let token = localStorage.getItem('token');
    $.ajax({
        url : baseURL+'driver/accept/assignment/'+driver_id,
        type : 'PUT',
        processData: false,
        contentType: false,
        headers : {
            'Authorization' : 'Bearer '+token,
        },
        success : function(resp) {
            console.log(resp);
            localStorage.setItem('customerDropLoc',JSON.stringify(resp.trip_data.drop_coordinate.data));
            localStorage.setItem('destination',JSON.stringify(resp.trip_data.pick_coordinate.data));
            showCustomerLocLineFromDriver(resp.driver_data.current_loc.data,JSON.stringify(resp.trip_data.pick_coordinate.data), resp.trip_data.drop_loc);
        },
        error : function(error) {
            console.log('Something went wrong '+error);
        },
    });
});

function showCustomerLocLineFromDriver(driverLoc, customerLoc, drop_loc) {
    customerLoc = JSON.parse(customerLoc);
    //console.log(customerLoc);
    //console.log(driverLoc);
    let map;
    let bounds = new google.maps.LatLngBounds();
    let mapOptions = {
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoom : 10,
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions); 
    let marker = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    marker.setVisible(false);    
    map.setCenter(customerLoc);
    map.setZoom(10);    
    marker.setPosition(customerLoc);
    marker.setVisible(true);
    
    let marker1 = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });
    marker1.setVisible(false);    
    map.setCenter(driverLoc);
    map.setZoom(10);    
    marker1.setPosition(driverLoc);
    marker1.setVisible(true); 
    calcDistFromDriverToCustomer(JSON.stringify(driverLoc),JSON.stringify(customerLoc),map,drop_loc);
}

function calcDistFromDriverToCustomer(sourceData, destinationData, map, drop_loc) {    
    let token = localStorage.getItem('token');
    const service = new google.maps.DistanceMatrixService();
    const origin = JSON.parse(sourceData);
    const destination = JSON.parse(destinationData);
    console.log('Origin : ' +sourceData);
    console.log('Destination : ' +destinationData);
    const request = {
        origins : [origin],
        destinations : [destination],
        travelMode : google.maps.TravelMode.DRIVING,
        unitSystem : google.maps.UnitSystem.METRIC,
        avoidHighways : false,
        avoidTolls : false,
    };
    service.getDistanceMatrix(request).then((response) => {  
        //console.log('Response : '+response);      
        showPath(origin,destination,map);
        $('#drop_location').text('Drop Location : '+drop_loc);
        $('#driverbtn').show();
        $('#tripinfo').show();
    });
}

$('#driverconfirmtbtn').on('click', function() {
    //$('#drop_location').text('Drop Location : '+drop_loc);
    $('#driverbtn').hide();
    $('#tripinfo').hide();
    $('#pac-input').hide();
    $('#pac-input1').hide();
    $('#drivertocustomermap').show();
});

function updatePilotLoc(driverID) {
    let loc = localStorage.getItem('source');
    let token = localStorage.getItem('token');
    let fd = new FormData();
    fd.append('driver_id', driverID);
    fd.append('current_loc', loc);
    $.ajax({
        url : baseURL+'driver/location/update',
        type : 'POST',
        processData: false,
        contentType: false,
        data : fd,
        headers : {
            'Authorization' : 'Bearer '+token,
        },
        success : function(resp) {
            console.log('Location Updated');
        },
        error : function(error) {
            console.log('Something went wrong : '+error);
        },
    });    
}

function timelyPilotLocationUpdater(){
    let driver_id = localStorage.getItem('driverID');
    //clearInterval(intervalId);
    let pos;
    const geocoder = new google.maps.Geocoder();
    const driverLocationUpdateId = setInterval(() => {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    localStorage.setItem('source', JSON.stringify(pos));
                    geocoder.geocode({ location: pos })
                    .then((response) => {
                    if(response.results[0]) {
                        localStorage.setItem('source_address',response.results[0].formatted_address);
                    } else {
                        localStorage.setItem('source_address','Not Available');
                    }
                    })
                    .catch((e) => window.alert("Geocoder failed due to: " + e));
                },
            );
        }
        updatePilotLoc(driver_id);
    }, 60000);    
}

$('#confirmbutton').on('click', function() {
    let source = localStorage.getItem('source');
    let source_loc = JSON.parse(source);
    let token = localStorage.getItem('token');
    let data = new FormData();
    let travel_data_id = 0;
    data.append('lat', source_loc.lat);
    data.append('lng', source_loc.lng);
    let customerId = localStorage.getItem('customerID');
    let source_latlong = localStorage.getItem('source');
    let destination_latlong = localStorage.getItem('destination');
    let destination_address = localStorage.getItem('destination_address');
    let source_address = localStorage.getItem('source_address');
    let estimated_fare = localStorage.getItem('estimated_fare');
    let td = new FormData();
    td.append('customer_id',customerId);
    //td.append('driver_id',driver_id);
    td.append('pick_coordinate',source_latlong);
    td.append('drop_coordinate',destination_latlong);
    td.append('drop_loc',JSON.stringify(destination_address));
    td.append('pic_up_loc',JSON.stringify(source_address));
    td.append('estimated_fare',estimated_fare);
    $.ajax({
        url : baseURL+'travel_data/create/',
        type : 'POST',
        processData: false,
        contentType: false,
        data: td,
        headers: { 'Authorization': 'Bearer '+token },
        success: function(resp) {
            travel_data_id = resp.trip_data.id;
            console.log(resp.trip_data);
            localStorage.setItem('tripID',resp.trip_data.id);
        },
        error: function(err) {
            console.log(err);
        },
    });
    setTimeout(() => {
        data.append('travel_data_id', travel_data_id);
        let timeInterval = setInterval(() => {
            $.ajax({
                url : baseURL+'driver/active/loggedin/getlocations',
                type : 'POST',
                processData: false,
                contentType: false,
                data : data,
                headers: { 'Authorization': 'Bearer '+token },
                success: function(resp) {
                    $('#confirmbtn').hide();
                    $('#connectingpilot').show();
                    let drivers = resp.near_by_drivers;
                    if(drivers.length != 0){
                        clearInterval(timeInterval);
                        console.log(drivers);
                        showActivePilots(drivers);                    
                        sendNotificationAndFindPilot(drivers);
                    }
                },
                error: function(err) {
                    console.log(err);
                },
            });
        }, 8000);
    }, 2000);
});

function showActivePilots(driverLoc) {
    let gmap;
    let bounds = new google.maps.LatLngBounds();
    let mapOptions = {
        zoom: 12,
        disableDefaultUI : true,
        styles: [
            {
                featureType: "landscape",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "administrative",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.park",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.place_of_worship",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.sports_complex",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway.controlled_access",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "water",
                stylers: [{ visibility: "off" }],
            },            
        ],
    };
    gmap = new google.maps.Map(document.getElementById("map"), mapOptions); 
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
        this.setZoom(12);
        google.maps.event.removeListener(boundsListener);
    });
}

function sendNotificationAndFindPilot(drivers) {
    let token = localStorage.getItem('token');
    let travel_data_id = localStorage.getItem('tripID');
    let driverids = [];
    for(let i=0; i<drivers.length; i++) {
        driverids.push(drivers[i][0]);
    }
    $.ajax({
        url : baseURL+'driver/send/notification',
        type : 'POST',
        dataType : 'json',
        data: JSON.stringify({ driverids, travel_data_id }),
        contentType: "application/json; charset=utf-8",
        headers: { 'Authorization': 'Bearer '+token },
        success: function(resp) {
            //console.log(resp.d);
            getConfirmationFromPilot(driverids);
        },
        error: function(err) {
            console.log(err);
        },
    });
}

function getConfirmationFromPilot(driverids) {
    let token = localStorage.getItem('token');
    let travel_data_id = localStorage.getItem('tripID');
    //console.log('Displaying driver ids : ');
    //console.log(driverids);
    const intervalId = setInterval(() => {
        console.log('Displaying driver ids : ');
        console.log(driverids);
        console.log(travel_data_id);
        $.ajax({
            url : baseURL+'driver/get/confirmation',
            type : 'POST',
            dataType : 'json',
            data: JSON.stringify({ driverids,travel_data_id }),
            contentType: "application/json; charset=utf-8",
            headers: { 'Authorization': 'Bearer '+token },
            success: function(resp) {                
                if(resp.trip_data.length > 0) {
                    clearInterval(intervalId);
                    console.log(resp);
                    console.log("A driver has accepted the trip request");
                    localStorage.setItem('driverID', resp.trip_data[0].id);
                    localStorage.setItem('driverName', resp.trip_data[0].name);
                    localStorage.setItem('driverLoc', JSON.stringify(resp.trip_data[0].current_loc.data));
                    //console.log(resp.driver_data);
                    let content = resp.trip_data[0].vehicle_reg_no+'<br />';
                    content += resp.trip_data[0].vehicle_model+'<br />';
                    content += resp.trip_data[0].vehicle_color+'<br />';
                    $('#pilotname').text(resp.trip_data[0].name);
                    $('#contact').text('Call : '+resp.trip_data[0].contact_no);
                    $('#vehicleinfo').html(content);
                    $('#rating').text('Rating : ' +resp.trip_data[0].rating);
                    $('#otp').text('OTP : '+resp.trip_data[1].otp);
                    $('#tripid').text('Trip # : '+resp.trip_data[0].travel_data_id);
                    $('#connectingpilot').hide();
                    $('#confirmbutton').hide();
                    $('#confirmbtn').hide();
                    $('#pilotinfo').show();
                    let pick_coordinate = localStorage.getItem('source');
                    console.log('Driver Loc :');
                    console.log(resp.trip_data[0].current_loc.data);
                    console.log('Customer Loc :');
                    console.log(pick_coordinate);
                    showCustomerAndPilotLocs(resp.trip_data[0].current_loc.data,pick_coordinate);
                } 
                else {
                    //console.log(resp);
                    console.log("No driver found till now");
                }               
            },
            error: function(err) {
                console.log(err);
            },
        });
    }, 7000);  
}

function showCustomerAndPilotLocs(driverLoc, customerLoc) {
    customerLoc = JSON.parse(customerLoc);
    let map;
    let mapOptions = {
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoom : 17,
        styles: [
            {
                featureType: "landscape",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.park",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.place_of_worship",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.sports_complex",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway.controlled_access",
                stylers: [{ visibility: "on" }],
            },
            {
                featureType: "water",
                stylers: [{ visibility: "off" }],
            },            
        ],
    };
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    let icon = {
        url: "icons/pin.png",
        scaledSize: new google.maps.Size(40, 40),
    };
    let marker = new google.maps.Marker({
        map,
        animation: google.maps.Animation.DROP,
    });    
    marker.setPosition(customerLoc);
    marker.setVisible(true);    
    let marker1 = new google.maps.Marker({
        map,
        animation: google.maps.Animation.DROP,
    });    
    marker1.setPosition(driverLoc);
    marker1.setVisible(true); 
    calculateDistance(JSON.stringify(driverLoc),JSON.stringify(customerLoc),map);
}

function initMap() {
    console.log('Initmap called');
    let map,infoWindow,infoWindowSource,infoWindowDest;
    const geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        disableDefaultUI : true,
        styles: [
            {
                featureType: "landscape",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.park",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.place_of_worship",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "poi.sports_complex",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway",
                stylers: [{ visibility: "off" }],
            },
            {
                featureType: "road.highway.controlled_access",
                stylers: [{ visibility: "on" }],
            },
            {
                featureType: "water",
                stylers: [{ visibility: "off" }],
            },            
        ],
    });
    infoWindow = new google.maps.InfoWindow();
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                localStorage.setItem('source', JSON.stringify(pos));
                map.setCenter(pos);
                let icon = {
                    url: "icons/pin.png",
                    scaledSize: new google.maps.Size(40, 40),
                };
                new google.maps.Marker({
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
    //map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
    const autocomplete = new google.maps.places.Autocomplete(input,options);  
    autocomplete.bindTo("bounds", map);
    infoWindowSource = new google.maps.InfoWindow();
    const infowindowContentSource = document.getElementById("infowindow-content-source");
    // let sourceIcon = {url: "icons/pin.png",scaledSize: new google.maps.Size(40, 40),};
    // icon: sourceIcon
    const sourceMarker = new google.maps.Marker({map,animation: google.maps.Animation.DROP,});
    autocomplete.addListener("place_changed", () => {
        infoWindowSource.close();
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
            map.setZoom(12);
        }
        sourceMarker.setPosition(place.geometry.location);
        sourceMarker.setVisible(true);
        infowindowContentSource.children["locsource"].textContent = 'Pick Up';
        //infowindowContentSource.children["place-address-source"].textContent = place.formatted_address;
        infoWindowSource.setContent(infowindowContentSource);
        infoWindowSource.open(map, sourceMarker);
        localStorage.setItem('source', JSON.stringify(place.geometry.location));
        localStorage.setItem('source_address', place.formatted_address);
        let sourceData = localStorage.getItem('source');
        let destinationData = localStorage.getItem('destination');
        if(destinationData != "") {
            calculateDistance(sourceData,destinationData,map);
        }
    });

    const input1 = document.getElementById("pac-input1");
    const options1 = {fields: ["formatted_address", "geometry", "name"],strictBounds: false,types: ["establishment"],};
    //map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
    const autocomplete1 = new google.maps.places.Autocomplete(input1,options1);  
    //autocomplete1.bindTo("bounds", map);
    infoWindowDest = new google.maps.InfoWindow();
    const infowindowContentDest = document.getElementById("infowindow-content-dest");
    infoWindowDest.setContent(infowindowContentDest);
    // let destIcon = {url: "icons/pin.png",scaledSize: new google.maps.Size(40, 40),};
    // icon: destIcon
    const destinationMarker = new google.maps.Marker({map,animation: google.maps.Animation.DROP,});
    autocomplete1.addListener("place_changed", () => {
        infoWindowDest.close();
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
            map.setZoom(12);
        }
        destinationMarker.setPosition(place1.geometry.location);
        destinationMarker.setVisible(true);
        infowindowContentDest.children["locdest"].textContent = 'Drop';
        //infowindowContentDest.children["place-address-dest"].textContent = place1.formatted_address;
        infoWindowDest.setContent(infowindowContentDest);
        infoWindowDest.open(map, destinationMarker);
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
    //console.log('Origin : ' +sourceData);
    //console.log('Destination : ' +destinationData);
    const request = {
        origins : [origin],
        destinations : [destination],
        travelMode : google.maps.TravelMode.DRIVING,
        unitSystem : google.maps.UnitSystem.METRIC,
        avoidHighways : true,
        avoidTolls : true,
        drivingOptions: {
            departureTime: new Date(Date.now() + 300000),  // for the time N milliseconds from now.
            trafficModel: 'bestguess'
        }
    };
    // const lineSymbol = {
    //     path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    //     scale: 8,
    //     strokeColor: "#393",
    // };
    // const line = new google.maps.Polyline({
    //     path: [ origin, destination,],
    //     icons: [
    //       {
    //         icon: lineSymbol,
    //         offset: "100%",
    //       },
    //     ],
    //     map: map,
    // });

    //animateCircle(line);

    service.getDistanceMatrix(request).then((response) => {  
        //console.log('Distance Matrix :');
        //console.log(response);      
        showPath(origin,destination,map);
        $.ajax({
            url : baseURL+'fare/customer/all/fares',
            type : 'GET',
            headers: { 'Authorization': 'Bearer '+token },
            success: function(resp) {
                console.log(resp.fares);
                let km = Math.ceil(Number(response.rows[0].elements[0].distance.value) / 1000);
                let total_fare = (km * resp.fares[1].value) + resp.fares[0].value;
                localStorage.setItem('estimated_fare', total_fare);
                $('#estimatedText').text('Estimated Fare : '+total_fare);
                $('#confirmbtn').show();
                $('#billarea').show();
                $('#tripUI').show();
            },
            error: function(err) {
                console.log(err);
            },
        });
    });
}

function animateCircle(line) {
    let count = 0;  
    window.setInterval(() => {
        count = (count + 1) % 200;    
        const icons = line.get("icons");    
        icons[0].offset = count / 2 + "%";
        line.set("icons", icons);
    }, 100);
}

function showPath(start,end,map) {
    const directionsRenderer = new google.maps.DirectionsRenderer();
    const directionsService = new google.maps.DirectionsService();
    directionsRenderer.setMap(map);
    calculateAndDisplayRoute(directionsService,directionsRenderer,start,end);
}

function calculateAndDisplayRoute(directionsService,directionsRenderer,start,end) {
    directionsService
    .route(
        { 
            origin: start, 
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem : google.maps.UnitSystem.METRIC,
            avoidHighways : true,
            avoidTolls : true,
            drivingOptions: {
                departureTime: new Date(Date.now() + 300000),  // for the time N milliseconds from now.
                trafficModel: 'bestguess'
            }
        }
    )
    .then((response) => {
        console.log(response);
        directionsRenderer.setDirections(response);
    })
    .catch((e) =>
        window.alert("Directions request failed")
    );
}

window.initMap = initMap;