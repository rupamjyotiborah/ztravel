<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>ZTravel</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" rel="stylesheet" />

        <!-- Styles -->
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-4bw+/aepP/YC94hEpVNVgiZdgIC5+VKNBQNGCHeKRQN+PtmoHDEXuppvnDJzQIu9" crossorigin="anonymous">
        <link href="{{URL::asset('css/style.css')}}" rel="stylesheet" />
        <link href="{{URL::asset('css/map.css')}}" rel="stylesheet" />
        <!-- Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-HwwvtgBNo3bZJJLYd8oVXjrBZt8cqVSpeBNS5n7C8IVInixGAoxmnlMuBnhbgrkm" crossorigin="anonymous"></script>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
        <script type="module" src="{{ URL::asset('js/apis.js') }}"></script>

    </head>
    <body class="bgc">
        <div class="container">
            <div class="row">
                <div class="col-md-3 col-lg-3 col-sm col-xs">
                    <h4><strong>ZTRAVEL</strong></h4>
                </div>
                <div class="col-md-9 col-lg-9 col-sm col-xs" id="username"></div>
            </div>
            <div class="row" id="loginUI">
                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                    <div class="logincard">
                        <form action="#" method="post">
                            <div class="row user">
                                <select id="user" name="user" class="form-control">
                                    <option value="customer">Customer</option>
                                    <option value="pilot">Pilot</option>
                                </select>
                            </div>
                            <div class="row contact_no">
                                <input type="text" name="contact_no" id="contact_no" class="form-control" placeholder="Phone No."/>
                            </div>
                            <div class="row password">
                                <input type="password" name="password" id="password" class="form-control" placeholder="Password"/>
                            </div>
                            <div class="row button">
                                <button id="login" class="btn btn-success">Login</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="row" id="mapUI">
                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="maparea">
                    <div class="pac-card" id="pac-card">                        
                        <div id="pac-container">
                            <input id="pac-input" type="text" placeholder="Pick Up Location" class="form-control pac-input" />
                            <input id="pac-input1" type="text" placeholder="Drop Location" class="form-control pac-input1" />
                        </div>
                        
                        <div id="map"></div>
                        <div id="infowindow-content">
                            <span id="destinationloc" class="title"></span><br />
                            <span id="place-address"></span>
                        </div>
                        <div id="infowindow-content-source">
                            <span id="locsource" class="title"></span><br />
                            <span id="place-address-source"></span>
                        </div>
                        <div id="infowindow-content-dest">
                            <span id="locdest" class="title"></span><br />
                            <span id="place-address-dest"></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" id="tripUI">
                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="billarea">
                    <div class="row">
                        <div class="col-md-6 col-lg-6 col-sm-6 col-xs-6" id="estimatedText"></div>
                        <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="confirmbtn" style="display:none;">
                            <button class="btn btn-success btn-block btn-lg" id="confirmbutton">Book a Bike</button>
                        </div>
                        <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="connectingpilot" style="display:none;">
                            <p>Finding the best captain for you...</p>
                        </div>
                        <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="pilotinfo" style="display:none;">
                            <div class="row">
                                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                    <p id="pilotname" style="float:left;"></p>
                                    <p id="contact" style="float:right;"></p>
                                </div>
                                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                    <p id="vehicleinfo" style="float:left;"></p>
                                    <p id="rating" style="float:right;"></p>
                                </div> 
                                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                    <p id="tripid"></p><button class="btn btn-danger btn-block" style="float:left;">Cancel</button>
                                    <p id="otp" style="float:right;"></p>
                                </div> 
                            </div>                                                       
                        </div>
                    </div>
                </div>
            </div>
            <div id="notificationModal" class="modal fade" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">You have a new assignment</h5>
                            <!-- <button type="button" class="close" data-dismiss="modal">&times;</button> -->
                        </div>
                        <!-- <div class="modal-body">
                            <p>This is a simple Bootstrap modal. Click the "Cancel button", "cross icon" or "dark gray area" to close or hide the modal.</p>
                        </div> -->
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" id="accept">Accept</button>
                            <button type="button" class="btn btn-danger" id="reject">Reject</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div class="row">
                <div class="col-md-12 col-lg-12 col-sm-12 col-xs-12" id="footerarea">
                    <center><p>Powered by RJ</p></center>                  
                </div>
            </div> -->

        </div>
        
    </body>
    <script src="{{ URL::asset('js/jquery.js') }}"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_API') }}&callback=initMap&libraries=places&v=weekly" defer></script>
    
</html>
