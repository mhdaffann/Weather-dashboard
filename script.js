// ======================================
// WEATHER DASHBOARD APPLICATION
// ======================================

// HTML Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContainer = document.getElementById("weatherContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const themeToggle = document.getElementById("themeToggle");

// Load saved favourites
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// ======================================
// WEATHER INFORMATION
// ======================================

function getWeatherInfo(code) {
const weather = {
0: ["Clear Sky", "☀️"],
1: ["Mainly Clear", "🌤️"],
2: ["Partly Cloudy", "⛅"],
3: ["Cloudy", "☁️"],
45: ["Foggy", "🌫️"],
48: ["Foggy", "🌫️"],
51: ["Light Drizzle", "🌦️"],
53: ["Drizzle", "🌦️"],
55: ["Heavy Drizzle", "🌧️"],
61: ["Light Rain", "🌧️"],
63: ["Rain", "🌧️"],
65: ["Heavy Rain", "🌧️"],
71: ["Light Snow", "❄️"],
73: ["Snow", "❄️"],
75: ["Heavy Snow", "❄️"],
80: ["Rain Showers", "🌦️"],
81: ["Rain Showers", "🌧️"],
82: ["Heavy Showers", "⛈️"],
95: ["Thunderstorm", "⛈️"]
};

return weather[code] || ["Unknown Weather", "🌡️"];

}

// ======================================
// SEARCH CITY
// ======================================

async function searchCity(city) {

if (!city.trim()) {
    alert("Please enter a city name!");
    return;
}

weatherContainer.innerHTML = "<h2>Searching...</h2>";

try {

    const geoURL =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoURL);

    if (!geoResponse.ok) {
        throw new Error("Unable to find city.");
    }

    const geoData = await geoResponse.json();

    console.log("Geocoding API Response:", geoData);

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found!");
    }

    const place = geoData.results[0];

    await getWeather(
        place.latitude,
        place.longitude,
        place.name,
        place.country
    );

} catch (error) {

    weatherContainer.innerHTML =
        `<p>${error.message || "Something went wrong. Check your internet connection."}</p>`;

}

}

// ======================================
// GET CURRENT WEATHER + 5 DAY FORECAST
// ======================================

async function getWeather(latitude, longitude, city, country = "") {

weatherContainer.innerHTML = "<h2>Loading weather...</h2>";

try {

    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

    const response = await fetch(weatherURL);

    if (!response.ok) {
        throw new Error("Weather service is unavailable.");
    }

    const data = await response.json();

    // Display raw API response in browser console
    console.log("Complete Weather API Response:", data);

    const current = data.current;
    const daily = data.daily;

    const [description, icon] =
        getWeatherInfo(current.weather_code);

    // Current weather display

    let html = `
        <h2>${city}, ${country}</h2>

        <div class="weather-icon">${icon}</div>

        <div class="temperature">
            ${current.temperature_2m}°C
        </div>

        <p>${description}</p>

        <div class="weather-details">

            <p>🌡️ Feels Like:
            ${current.apparent_temperature}°C</p>

            <p>💧 Humidity:
            ${current.relative_humidity_2m}%</p>

            <p>💨 Wind:
            ${current.wind_speed_10m} km/h</p>

            <p>🌧️ Precipitation:
            ${current.precipitation} mm</p>

        </div>

        <br>

        <button id="saveFavoriteBtn">
            ⭐ Save Favourite
        </button>

        <hr style="margin:25px 0;">

        <h2>📅 5-Day Forecast</h2>

        <div class="forecast-container">
    `;

    // Five-day forecast

    for (let i = 0; i < daily.time.length; i++) {

        const [dayDescription, dayIcon] =
            getWeatherInfo(daily.weather_code[i]);

        const date = new Date(daily.time[i] + "T00:00:00");

        const dayName = date.toLocaleDateString(
            "en-US",
            { weekday: "short" }
        );

        html += `
            <div class="forecast-card">

                <h3>${dayName}</h3>

                <div class="forecast-icon">
                    ${dayIcon}
                </div>

                <p>${dayDescription}</p>

                <p>
                    🔺 ${daily.temperature_2m_max[i]}°C
                </p>

                <p>
                    🔻 ${daily.temperature_2m_min[i]}°C
                </p>

            </div>
        `;
    }

    html += `
        </div>
    `;

    weatherContainer.innerHTML = html;

    // Save favourite button

    document.getElementById("saveFavoriteBtn")
        .addEventListener("click", () => {

            addFavorite(
                city,
                country,
                latitude,
                longitude
            );

        });

} catch (error) {

    console.error("Weather Error:", error);

    weatherContainer.innerHTML =
        `<p>Unable to load weather. Please check your internet connection and try again.</p>`;

}

}

// ======================================
// FAVOURITE CITIES
// ======================================

function addFavorite(city, country, latitude, longitude) {

const exists = favorites.some(item =>
    item.latitude === latitude &&
    item.longitude === longitude
);

if (exists) {
    alert("City already saved!");
    return;
}

favorites.push({
    city,
    country,
    latitude,
    longitude
});

localStorage.setItem(
    "favorites",
    JSON.stringify(favorites)
);

displayFavorites();

alert("City added to favourites!");

}

function displayFavorites() {

favoritesContainer.innerHTML = "";

if (favorites.length === 0) {
    favoritesContainer.textContent =
        "No favourite cities saved yet.";
    return;
}

favorites.forEach((item, index) => {

    const div = document.createElement("div");
    div.className = "favorite-item";

    const name = document.createElement("span");
    name.textContent = `${item.city}, ${item.country}`;

    const viewButton = document.createElement("button");
    viewButton.textContent = "View";

    viewButton.addEventListener("click", () => {

        getWeather(
            item.latitude,
            item.longitude,
            item.city,
            item.country
        );

    });

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {

        favorites.splice(index, 1);

        localStorage.setItem(
            "favorites",
            JSON.stringify(favorites)
        );

        displayFavorites();

    });

    div.append(name, viewButton, removeButton);

    favoritesContainer.appendChild(div);

});

}

// ======================================
// GEOLOCATION API
// ======================================

locationBtn.addEventListener("click", () => {

if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
}

weatherContainer.innerHTML =
    "<p>Finding your location...</p>";

navigator.geolocation.getCurrentPosition(

    position => {

        getWeather(
            position.coords.latitude,
            position.coords.longitude,
            "Your Location"
        );

    },

    error => {

        console.error("Location Error:", error);

        weatherContainer.innerHTML =
            "<p>Location permission denied or unavailable.</p>";

    }

);

});

// ======================================
// SEARCH BUTTON
// ======================================

searchBtn.addEventListener("click", () => {

searchCity(cityInput.value);

});

cityInput.addEventListener("keypress", event => {

if (event.key === "Enter") {
    searchCity(cityInput.value);
}

});

// ======================================
// DARK MODE
// ======================================

function applyTheme() {

const darkMode =
    localStorage.getItem("darkMode") === "true";

document.body.classList.toggle("dark", darkMode);

themeToggle.textContent = darkMode
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";

}

themeToggle.addEventListener("click", () => {

const darkMode =
    document.body.classList.toggle("dark");

localStorage.setItem("darkMode", darkMode);

applyTheme();

});

// ======================================
// INITIALIZE APPLICATION
// ======================================

applyTheme();
displayFavorites();
