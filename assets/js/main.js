"use strict"

// wind Richung, Bgs

/* ===== IMPORT & GLOBAL VARIABLES ===== */
import {apiKeyGeoApify, apiKeyOpenWeather, endpointGeoApify, endpointOpenWeather} from "./api.js";

const background = document.querySelector("section");

const summaryIconOutput = document.querySelector(".icon-container");
const summaryDescriptionOutput = document.querySelector(".description");

const detailsRainOutput = document.querySelector(".rain");
const detailsWindOutput = document.querySelector(".wind");
const detailsHumidityOutput = document.querySelector(".humidity");
const detailsTimeOutput = document.querySelector(".time");
const detailsSunOutput = document.querySelector(".sun");

const forecast24hOutput = document.querySelector(".forecast24h");

const footerOutput = document.querySelector(".footer");

let startUp = true;


/* ===== FETCH DATA FUNCTIONS ===== */
const fetchLocation = () => {
  if (!startUp) return;

  let lat, lon;
  if ("geolocation" in navigator) {
    // Prompt user for permission to access their location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        fetchCurrentWeather(lat, lon);
      },
      (error) => {
        console.log("Browser location FAILED");
      }
    );
  } else {
    console.error("Browser not supporting Geolocation... fetching via IP...");
  }

  if (!lat) {
    let fetchStrIP = `https://${endpointGeoApify}/v1/ipinfo?apiKey=${apiKeyGeoApify}`;

    fetch(fetchStrIP)
      .then(response => {
        if (!response.ok) throw new Error("IP response.ok FAILED");
        return response.json();
      })
      .then(ipData => {
        let location = ipData.city.name;
        document.body.querySelector("#location").value = ipData.city.name;
        fetchCoordinates(location)
      })
  } else {
    fetchCurrentWeather(lat, lon);
  }
  startUp = false;
}


const fetchCoordinates = (location) => {
  let lat, lon;

  let fetchStrGeo = `http://${endpointOpenWeather}/geo/1.0/direct?q=${location}&limit=1&appid=${apiKeyOpenWeather}`;

  fetch(fetchStrGeo)
    .then(response => {
      if(!response.ok) throw new Error("GEO response.ok FAILED");
      return response.json();
    })
    .then(geoData => {
      lat = geoData[0].lat;
      lon = geoData[0].lon;
    })
    .then(()=> {
      fetchCurrentWeather(lat, lon);

      fetch24hWeather(lat, lon);
    })
}


const fetchCurrentWeather = (lat, lon) => {
  let fetchStrWeather = `https://${endpointOpenWeather}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKeyOpenWeather}&units=metric&lang=de`;

  fetch(fetchStrWeather)
  .then(response => {
    if(!response.ok) throw new Error("WEATHER response.ok FAILED");
    return response.json();
  })
  .then(weatherData => {
    displayCurrentWeather(weatherData);
  })
}


const fetch24hWeather = (lat,lon) => {
  let fetchStr24h = `https://${endpointOpenWeather}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKeyOpenWeather}&units=metric&lang=de&cnt=8`;

  fetch(fetchStr24h)
    .then(response => {
      if(!response.ok) throw new Error("FORECAST24h response.ok FAILED");
      return response.json();
    })
    .then(foreCastData => {
      display24hWeather(foreCastData);
    })
}


/* ===== UTILITY FUNCTIONS ===== */
const refreshLocation = () => {
  // document.body.querySelector("#location").value = "Wyhl";

  let location = document.body.querySelector("#location").value;
  fetchCoordinates(location);
}


const calcDates = (weatherData) => {

  /*
  - API liefert alle Zeiten in UTC (s) --*1000--> JS (ms)
  - Browser immer auto-umrechnung: UTC in vor Ort
  - im format{}: timezone: UTC --> Sage Browser deine vor Ort Zeit ist UTC, nicht umrechnen

  - .toLocaleDateString("de", weekday:"long")
  */

  // Umrechnung UTC (s) -> JS (ms) + API liefert timezone auch in s
  const secToMs = 1000;
  const timezone = weatherData.timezone * secToMs;
  
  const dateFormatDateUser = { day: "2-digit", month: "short", year: "numeric" }    // Browser auto-umrechnung in vor Ort Zeit
  const dateFormatTimeUser = { hour12: false, hour: "2-digit", minute: "2-digit" }  // Browser auto-umrechnung in vor Ort Zeit
  const dateFormatDateUTC = { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" }    // timezone:UTC === Browser keine auto-umrechnung
  const dateFormatTimeUTC = { timeZone: "UTC", hour12: false, hour: "2-digit", minute: "2-digit" }  // timezone:UTC === Browser keine auto-umrechnung

  // Zeit des letzten Datensatzes (Date-Time in UTC)
  const dtUtc = new Date(weatherData.dt * secToMs); 

  // User vor Ort Zeiten (aktuell + Datensatz) - vom Browser auto-umgerechnet
  const userDate = new Date(Date.now()).toLocaleString(undefined, dateFormatDateUser); // aktuelle Zeit - User vor Ort-Zeitzone
  const userTime = new Date(Date.now()).toLocaleString(undefined, dateFormatTimeUser); // aktuelle Zeit - User vor Ort-Zeitzone
  const dtUserDate = new Date(dtUtc).toLocaleString(undefined, dateFormatDateUser);    // datensatz Zeit - User vor Ort-Zeitzone
  const dtUserTime = new Date(dtUtc).toLocaleString(undefined, dateFormatTimeUser);    // datensatz Zeit - User vor Ort-Zeitzone

  // Remote Ort Zeiten (aktuell + Datensatz) - keine Browser auto-umrechnung
  const remoteDate = new Date(Date.now() + timezone).toLocaleString(undefined, dateFormatDateUTC); // aktuelle Zeit - remote Ort-Zeitzone (von uns gerechnet)
  const remoteTime = new Date(Date.now() + timezone).toLocaleString(undefined, dateFormatTimeUTC); // aktuelle Zeit - remote Ort-Zeitzone (von uns gerechnet)
  const dtRemoteDate = new Date(dtUtc + timezone).toLocaleString(undefined, dateFormatDateUTC);    // datensatz Zeit - remote Ort-Zeitzone (von uns gerechnet)
  const dtRemoteTime = new Date(dtUtc + timezone).toLocaleString(undefined, dateFormatTimeUTC);    // datensatz Zeit - remote Ort-Zeitzone (von uns gerechnet)

  // console.log(userDate);
  // console.log(userTime);
  // console.log(dtUserDate);
  // console.log(dtUserTime);

  // console.log(remoteDate);
  // console.log(remoteTime);
  // console.log(dtRemoteDate);
  // console.log(dtRemoteTime);

  const timestamp = new Date(Date.now()).toLocaleString("de");
  const sunrise = new Date((weatherData.sys.sunrise * secToMs) + timezone).toLocaleString(undefined, dateFormatTimeUTC);
  const sunset = new Date((weatherData.sys.sunset * secToMs) + timezone).toLocaleString(undefined, dateFormatTimeUTC);

  return [sunrise, sunset, remoteTime, timestamp];
}


/* ===== UPDATE UI FUNCTIONS ===== */
const setBackground = (id, remoteTime) => {
  let url;
  if (id <= 299) {
    if(remoteTime >= "07:00" && remoteTime <= "19:00"){
      url = "./assets/img/thunderstorm/thunderstorm_day.jpeg";
    } else {
      url = "./assets/img/thunderstorm/thunderstorm_night.jpeg";
    }
  } else if (id >= 300 && id <= 399) {
    if(remoteTime >= "07:00" && remoteTime <= "19:00"){
      url = "./assets/img/drizzle/drizzle_day.jpeg";
    } else {
      url = "./assets/img/drizzle/drizzle_night.jpeg";
    }
  } else if (id >= 500 && id <= 599) {
    if(remoteTime >= "07:00" && remoteTime <= "19:00"){
      url = "./assets/img/rain/rain_day.jpeg";
    } else {
      url = "./assets/img/rain/rain_night.jpeg";
    }
  } else if (id >= 600 && id <= 699) {
    if(remoteTime >= "07:00" && remoteTime <= "19:00"){
      url = "./assets/img/snow/snow_day.jpeg";
    } else {
      url = "./assets/img/snow/snow_night.jpeg";
    }
  } else if (id >= 700 && id <= 799) {
    url = "./assets/img/atmosphere/atmosphere.jpeg";
  } else if (id === 800) {
    if(remoteTime >= "06:00" && remoteTime <= "11:59"){
      url = "./assets/img/clear/clear_morning.jpeg";
    } else if (remoteTime >= "12:00" && remoteTime <= "17:59"){
      url = "./assets/img/clear/clear_day.jpeg";
    } else if (remoteTime >= "18:00" && remoteTime <= "20:59"){
      url = "./assets/img/clear/clear_evening.jpeg";
    } else {
      url = "./assets/img/clear/clear_night.jpeg";
    }
  } else if (id >= 800 && id <= 899) {
    if(remoteTime >= "06:00" && remoteTime <= "11:59"){
      url = "./assets/img/clouds/clouds_morning.jpeg";
    } else if (remoteTime >= "12:00" && remoteTime <= "17:59"){
      url = "./assets/img/clouds/clouds_day.jpeg";
    } else if (remoteTime >= "18:00" && remoteTime <= "20:59"){
      url = "./assets/img/clouds/clouds_evening.jpeg";
    } else {
      url = "./assets/img/clouds/clouds_night.jpeg";
    }
  }
  background.style.backgroundImage = `url(${url})`;
}


const displayCurrentWeather = (weatherData) => {
  const dates = calcDates(weatherData);

  setBackground(weatherData.weather[0].id, dates[2]);

  const degrees = weatherData.wind.deg;
  let direction;
  if (degrees > 335 || degrees <= 20) direction = "N";
  else if (degrees > 20 || degrees <= 65) direction = "NO";
  else if (degrees > 65 || degrees <= 110) direction = "O";
  else if (degrees > 110 || degrees <= 155) direction = "SO";
  else if (degrees > 155 || degrees <= 200) direction = "S";
  else if (degrees > 200 || degrees <= 245) direction = "SW";
  else if (degrees > 245 || degrees <= 290) direction = "W";
  else if (degrees > 290 || degrees <= 335) direction = "NW";
  
  let rain = "--";
  if(weatherData.rain){
    rain = weatherData.rain["1h"];
  }

  summaryIconOutput.innerHTML = `
    <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png">
    <p>${Math.round(weatherData.main.temp)} °C</p>
  `;
  summaryDescriptionOutput.textContent = `${weatherData.weather[0].description}`;

  detailsRainOutput.textContent = `${rain} mm`;
  detailsWindOutput.textContent = `(${direction}) ${Math.round(weatherData.wind.speed)} m/s`;
  detailsHumidityOutput.textContent = `${weatherData.main.humidity} %`;
  detailsTimeOutput. textContent = `${dates[2]} (${weatherData.sys.country})`;
  detailsSunOutput.textContent = `${dates[0]} / ${dates[1]}`;

  footerOutput.innerHTML = `
    <!-- <p>Placeholder</p> -->
    <p>${dates[3]}</p>
  `;
}


const display24hWeather = (foreCastData) => {

  // date calc

  forecast24hOutput.innerHTML = ``;

  foreCastData.list.forEach((item) => {
    const outputHTML = `
      <div class="forecast24h-item">
        <p>${item.dt_txt.slice(10, 16)}</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
        <p>${item.weather[0].main}</p>
        <p>${Math.round(item.main.temp)} °C</p>
        <p>${Math.round(item.wind.speed)} m/s</p>
      </div>
    `;
    forecast24hOutput.insertAdjacentHTML("beforeend", outputHTML);
  })
}

/* ===== STARTUP ACTIONS ===== */
fetchLocation();

document.body.querySelector(".header button").addEventListener("click", refreshLocation);