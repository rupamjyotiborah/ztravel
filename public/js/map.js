function initMap() 
{
  let map, infoWindow;
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40.749933, lng: -73.98633 },
    zoom: 15,
    mapTypeControl: false,
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
          infoWindow.setPosition(pos);
          //infoWindow.setContent("Current Location");
          infoWindow.open(map);
          map.setCenter(pos);
      },
      () => {
          handleLocationError(true, infoWindow, map.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  const card = document.getElementById("pac-card");
  const input = document.getElementById("pac-input");
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    strictBounds: false,
    types: ["establishment"],
  };

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  const autocomplete = new google.maps.places.Autocomplete(input,options);

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  
  autocomplete.bindTo("bounds", map);

  infoWindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");
  infoWindow.setContent(infowindowContent);

  const marker = new google.maps.Marker({ map,anchorPoint: new google.maps.Point(0, -29), });

  autocomplete.addListener("place_changed", () => {
    infoWindow.close();
    marker.setVisible(false);

    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(15);
    }

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    infowindowContent.children["place-name"].textContent = place.name;
    infowindowContent.children["place-address"].textContent = place.formatted_address;
    infoWindow.open(map, marker);
    localStorage.setItem('destination', JSON.stringify(place.geometry.location));
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

function calculateDistance(sourceData, destinationData, map) {
  const service = new google.maps.DistanceMatrixService();
  const origin = JSON.parse(sourceData);
  const destination = JSON.parse(destinationData);
  const request = {
    origins: [origin],
    destinations: [destination],
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: false,
    avoidTolls: false,
  };
  //console.log('Request : ');
  //console.log(request);
  service.getDistanceMatrix(request).then((response) => {
    //console.log('Response : ');
    //console.log(response);
    //console.log('Origin Address : '+response.originAddresses);
    //console.log('Destination Address : '+response.destinationAddresses);
    //console.log('Total Distance : '+response.rows[0].elements[0].distance.text);
    //console.log('Total Time : '+response.rows[0].elements[0].duration.text);
    showPath(origin,destination,map);
  });
}

function showPath(start,end,map) {  
  //console.log('Start : ' +start);
  //console.log('End : ' +end);
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const directionsService = new google.maps.DirectionsService();
  directionsRenderer.setMap(map);
  calculateAndDisplayRoute(directionsService, directionsRenderer, start, end);
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
