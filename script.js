// Weather Dashboard Application

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const weatherContainer = document.getElementById("weatherContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const themeToggle = document.getElementById("themeToggle");

// Load saved preferences
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Weather descriptions
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

// Search for a city
async function searchCity(city) {
if (!city.trim()) {
alert("Please enter a city name!");
return;
}

weatherContainer.innerHTML = "<p>Loading weather...</p>";

try {
    const geoURL =
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const geoResponse = await fetch(geoURL);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
        weatherContainer.textContent = "City not found. Try another city.";
        return;
    }

    const place = geoData.results[0];

    await getWeather(
        place.latitude,
        place.longitude,
        place.name,
        place.country
    );

} catch (error) {
    weatherContainer.textContent = "Something went wrong. Please try again.";
}

}

// Get weather using coordinates
async function getWeather(latitude, longitude, city, country = "") {
weatherContainer.innerHTML = "<p>Loading weather...</p>";

try {
    const weatherURL =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;

    const response = await fetch(weatherURL);
    const data = await response.json();

    if (!response.ok || !data.current) {
        throw new Error("Weather data unavailable");
    }

    const current = data.current;
    const [description, icon] = getWeatherInfo(current.weather_code);

    weatherContainer.innerHTML = `
        <h2>${city}, ${country}</h2>
        <div class="weather-icon">${icon}</div>
        <div class="temperature">${current.temperature_2m}°C</div>
        <p>${description}</p>

        <div class="weather-details">
            <p>🌡️ Feels Like: ${current.apparent_temperature}°C</p>
            <p>💧 Humidity: ${current.relative_humidity_2m}%</p>
            <p>💨 Wind: ${current.wind_speed_10m} km/h</p>
            <p>🌧️ Precipitation: ${current.precipitation} mm</p>
        </div>

        <br>
        <button id="saveFavoriteBtn">⭐ Save Favourite</button>
    `;

    document.getElementById("saveFavoriteBtn")
        .addEventListener("click", () => {
            addFavorite(city, country, latitude, longitude);
        });

} catch (error) {
    weatherContainer.textContent =
        "Unable to get weather information. Please try again.";
}

}

// Add favourite city
function addFavorite(city, country, latitude, longitude) {
const exists = favorites.some(
item => item.latitude === latitude &&
item.longitude === longitude
);

if (exists) {
    alert("This city is already in your favourites!");
    return;
}

favorites.push({ city, country, latitude, longitude });

localStorage.setItem("favorites", JSON.stringify(favorites));

displayFavorites();

alert("City added to favourites!");

}

// Display favourite cities
function displayFavorites() {
favoritesContainer.innerHTML = "";

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
        localStorage.setItem("favorites", JSON.stringify(favorites));
        displayFavorites();
    });

    div.append(name, viewButton, removeButton);
    favoritesContainer.appendChild(div);
});

if (favorites.length === 0) {
    favoritesContainer.textContent = "No favourite cities saved yet.";
}

}

// Geolocation API
locationBtn.addEventListener("click", () => {
if (!navigator.geolocation) {
alert("Geolocation is not supported by your browser.");
return;
}

navigator.geolocation.getCurrentPosition(
    position => {
        getWeather(
            position.coords.latitude,
            position.coords.longitude,
            "Your Location"
        );
    },
    () => {
        alert("Unable to access your location. Please allow location permission.");
    }
);

});

// Search button
searchBtn.addEventListener("click", () => {
searchCity(cityInput.value);
});

// Search using Enter key
cityInput.addEventListener("keypress", event => {
if (event.key === "Enter") {
searchCity(cityInput.value);
}
});

// Dark mode
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

// Initialize application
applyTheme();
displayFavorites();
