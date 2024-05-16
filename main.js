/* Wind & Wetter Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 5);

// thematische Layer
let themaLayer = {
    forecast: L.featureGroup().addTo(map),
    wind: L.featureGroup().addTo(map)
}

// Hintergrundlayer
let layerControl = L.control.layers({
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery").addTo(map)
}, {
    "Wettervorhersage MET Norway": themaLayer.forecast,
    "ECMWF Windvorhersage": themaLayer.wind
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);

// Wettervorhersage MET Norway
async function showForecast(url) {
    let response = await fetch(url);
    let jsondata = await response.json();

    // aktuelles Wetter und Wettervorhersage implementieren
    console.log(jsondata);
    L.geoJson(jsondata, {
        pointToLayer: function(feature, latlng) {
            let details = feature.properties.timeseries[0].data.instant.details;
            let time = new Date(feature.properties.timeseries[0].time);
            

            let content = `
                <h4>Wettervorhersage für ${time.toLocaleString()}</h4>
                <ul>

                    <li>Luftdruck Meereshöhe (hPa): ${details.air_pressure_at_sea_level}</li>
                    <li>Lufttemperatur (°C): ${details.air_temperature}</li>
                    <li>Bewölku8ngsgrad (%): ${details.cloud_area_fraction}</li>
                    <li>Relative Feuchtigkeit (%): ${details.relative_humidity}</li>
                    <li>Windrichtung (°): ${details.wind_from_direction}</li>
                    <li>Windgeschwindigkeit (km/h): ${Math.round(details.wind_speed*3.6)}</li>

                </ul>
                `;

            // Wettericons für die nächsten 24 Stunden
            for (let i = 0; i <= 24; i += 3) {
                let symbol = feature.properties.timeseries[i].data.next_1_hours.summary.symbol_code;
                let time = new Date(feature.properties.timeseries[i].time);
                content += `<img src = "icons/${symbol}.svg" alt = "${symbol}" style = "width:32px" title = "${time.toLocaleString()}">`;
                console.log(i, symbol);
            }

            // Link zum Datendownload -> += an bestehende Variable anhängen
            content += `
                <p><a href = "${url}" target = "met.no">Daten downloaden</a></p>
                `;

            L.popup(latlng, {
                content: content
            }).openOn(themaLayer.forecast);

        }
    }).addTo(themaLayer.forecast);
}
//showForecast("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=47.267222&lon=11.392778");

// auf Kartenklick reagieren
map.on("click", function(evt) {
    //console.log(evt);
    //console.log(evt.latlng.lat, evt.latlng.lng);
    showForecast(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${evt.latlng.lat}&lon=${evt.latlng.lng}`);

});

// KLick auf Innsbruck simulieren
map.fire("click", {
    latlng: ibk
});

// Windkarte
async function loadWind(url) {
    const response = await fetch(url);
    const jsondata = await response.json();
    console.log(jsondata);
    L.velocityLayer({
        data: jsondata,
        lineWidth: 2,
        displayOptions: {
            directionsString: "Windrichtung",
            speedString: "Windgeschwindigkeit",
            speedUnit: "k/h",
            position: "bottomright",
            velocityType:""
        }
    }).addTo(themaLayer.wind);
}
loadWind("https://geographie.uibk.ac.at/data/ecmwf/data/wind-10u-10v-europe.json");
