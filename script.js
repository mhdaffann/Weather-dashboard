// =====================================
// WEATHER DASHBOARD
// =====================================

// HTML Elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContainer = document.getElementById("weatherContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const themeToggle = document.getElementById("themeToggle");

// Load saved favourites safely
let favorites = [];

try {
favorites = JSON.parse(localStorage.getItem("favorites")) || [];
} catch (error) {
favorites = [];
}

// =====================================
// WEATHER INFORMATION
// =====================================

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
95: ["Thunderstorm", "⛈️"],
96: ["Thunderstorm", "⛈️"],
99: ["Thunderstorm", "⛈️"]
};

return weather[code] || ["Unknown Weather", "🌡️"];

}

// =====================================
// SEARCH CITY
// =====================================

async function searchCity(city) {
if (!city.trim()) {
weatherContainer.textContent = "Please enter a city name.";
return;
}

weatherContainer.innerHTML = "<p>Searching for city...</p>";

try {
    const geoURL =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(geoURL);

    if (!response.ok) {
        throw new Error("Unable to connect to the location service.");
    }

    const geoData = await response.json();

    console.log("Geocoding API Response:", geoData);

    if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try another city.");
    }

    const place = geoData.results[0];

    await getWeather(
        place.latitude,
        place.longitude,
        place.name,
        place.country || ""
    );

} catch (error) {
    weatherContainer.textContent = error.message;
}

}

// =====================================
// GET WEATHER AND FORECAST
// =====================================

async function getWeather(latitude, longitude, city, country = "") {
weatherContainer.innerHTML = "<p>Loading weather data...</p>";

try {
    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;

    const response = await fetch(weatherURL);

    if (!response.ok) {
        throw new Error("Weather service is unavailable.");
    }

    const data = await response.json();

    // Log raw API response
    console.log("Complete Weather API Response:", data);

    if (!data.current || !data.daily) {
        throw new Error("Weather information is incomplete.");
    }

    const current = data.current;
    const daily = data.daily;

    const [description, icon] =
        getWeatherInfo(current.weather_code);

    // Current weather
    let html = `
        <h2>${city}, ${country}</h2>

        <div class="weather-icon">${icon}</div>

        <div class="temperature">
            ${current.temperature_2m}°C
        </div>

        <p>${description}</p>

        <div class="weather-details">
            <p>🌡️ Feels Like: ${current.apparent_temperature}°C</p>
            <p>💧 Humidity: ${current.relative_humidity_2m}%</p>
            <p>💨 Wind: ${current.wind_speed_10m} km/h</p>
            <p>🌧️ Precipitation: ${current.precipitation} mm</p>
        </div>

        <br>

        <button id="saveFavoriteBtn">
            ⭐ Save Favourite
        </button>

        <hr style="margin:25px 0;">

        <h2>📅 5-Day Forecast</h2>

        <div class="forecast-container">
    `;

    // Generate forecast cards
    for (let i = 0; i < daily.time.length; i++) {
        const [dayDescription, dayIcon] =
            getWeatherInfo(daily.weather_code[i]);

        const date = new Date(daily.time[i] + "T00:00:00");

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        html += `
            <div class="forecast-card">
                <h3>${dayName}</h3>
                <div class="forecast-icon">${dayIcon}</div>
                <p>${dayDescription}</p>
                <p>⬆️ ${daily.temperature_2m_max[i]}°C</p>
                <p>⬇️ ${daily.temperature_2m_min[i]}°C</p>
            </div>
        `;
    }

    html += `</div>`;

    weatherContainer.innerHTML = html;

    // Save favourite
    document.getElementById("saveFavoriteBtn")
        .addEventListener("click", () => {
            addFavorite(city, country, latitude, longitude);
        });

} catch (error) {
    console.error("Weather Error:", error);

    weatherContainer.textContent =
        "Unable to load weather. Please check your internet connection and try again.";
}

}

// =====================================
// FAVOURITES
// =====================================

function addFavorite(city, country, latitude, longitude) {
const exists = favorites.some(item =>
item.latitude === latitude &&
item.longitude === longitude
);

if (exists) {
    alert("This city is already in your favourites!");
    return;
}

favorites.push({
    city,
    country,
    latitude,
    longitude
});

localStorage.setItem("favorites", JSON.stringify(favorites));

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

// =====================================
// GEOLOCATION
// =====================================

locationBtn.addEventListener("click", () => {
if (!navigator.geolocation) {
alert("Geolocation is not supported by your browser.");
return;
}

weatherContainer.innerHTML = "<p>Finding your location...</p>";

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

        weatherContainer.textContent =
            "Unable to access your location. Please check your browser permissions.";
    }
);

});

// =====================================
// SEARCH BUTTON
// =====================================

searchBtn.addEventListener("click", () => {
searchCity(cityInput.value);
});

cityInput.addEventListener("keydown", event => {
if (event.key === "Enter") {
searchCity(cityInput.value);
}
});

// =====================================
// DARK MODE
// =====================================

function applyTheme() {
const darkMode = localStorage.getItem("darkMode") === "true";

document.body.classList.toggle("dark", darkMode);

themeToggle.textContent = darkMode
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";

}

themeToggle.addEventListener("click", () => {
const darkMode = document.body.classList.toggle("dark");

localStorage.setItem("darkMode", darkMode);

applyTheme();

});

// =====================================
// START APPLICATION
// =====================================

applyTheme();
displayFavorites();
