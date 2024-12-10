const apiKey = '9a31e27797ad0b6890fbb15fdb11f6f6';
let isCelsius = true;
let timeIntervalId; // Global variable to store interval ID
let lastSearchedCity = null; // Variable to store the last searched city

function fetchWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherData(latitude, longitude);
        }, () => {
            // Default to Lusaka, Zambia if geolocation is disabled or fails
            fetchWeatherData(-15.3875, 28.3228);
        });
    } else {
        // Default to Lusaka, Zambia if geolocation is not supported
        fetchWeatherData(-15.3875, 28.3228);
    }
}

function fetchWeatherByCity(city = null) {
    const inputCity = city || document.getElementById('city-input').value;
    lastSearchedCity = inputCity; // Store the last searched city
    fetchWeatherData(null, null, inputCity);
}

async function fetchWeatherData(lat, lon, city = null) {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.style.display = 'block'; // Show loading spinner

    try {
        const url = city 
            ? `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
            : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`City "${city}" not found.`);
            } else {
                throw new Error('Failed to fetch weather data. Please try again.');
            }
        }

        const data = await response.json();
        updateWeatherDisplay(data);
        fetchForecastData(data.coord.lat, data.coord.lon);
    } catch (error) {
        showError(error.message); // Display the error message to the user
        console.error(error); // Log the error for debugging
    } finally {
        if (loadingElement) loadingElement.style.display = 'none'; // Hide loading spinner
    }
}

function updateWeatherDisplay(data) {
    if (!data || !data.name) {
        showError('Weather data is unavailable. Please try a different city.');
        return;
    }

    const { name, main, weather, wind, timezone } = data;
    document.getElementById('city-name').textContent = `Weather in ${name}`;
    document.getElementById('temperature').textContent = formatTemperature(main.temp);
    document.getElementById('condition').textContent = weather[0]?.description || 'N/A';
    document.getElementById('humidity').textContent = main.humidity || 'N/A';
    document.getElementById('wind').textContent = wind.speed || 'N/A';
    document.getElementById('weather-icon').src = 
        weather[0]?.icon 
        ? `http://openweathermap.org/img/wn/${weather[0].icon}@2x.png` 
        : 'default-icon.png';

    setWeatherBackground(weather[0]?.main?.toLowerCase() || 'default');
    displayTime(timezone);
}

async function fetchForecastData(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    updateForecastDisplay(data.list);
}

function updateForecastDisplay(forecast) {
    const forecastContainer = document.getElementById('forecastDays');
    forecastContainer.innerHTML = '';

    const dailyForecasts = forecast.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

    dailyForecasts.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.innerHTML = `
            <h3>${new Date(day.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}</h3>
            <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather Icon">
            <p>${formatTemperature(day.main.temp)}</p>
            <p>${day.weather[0].description}</p>
        `;
        forecastContainer.appendChild(dayElement);
    });
}

function displayTime(timezone) {
    const timeElement = document.getElementById('time');

    // Clear any existing interval to avoid overlapping intervals
    if (timeIntervalId) clearInterval(timeIntervalId);

    function updateClock() {
        const now = new Date();
        const utcTime = now.getTime() + now.getTimezoneOffset() * 60000; // Get UTC time in ms
        const localTime = new Date(utcTime + timezone * 1000); // Corrected timezone offset
        timeElement.textContent = localTime.toLocaleTimeString();
    }

    updateClock(); // Initial call to display the time immediately
    timeIntervalId = setInterval(updateClock, 1000); // Store interval ID to clear it later
}

function setWeatherBackground(condition) {
    document.body.className = ''; 
    if (condition.includes("clear")) {
        document.body.classList.add('clear');
    } else if (condition.includes("sun")) {
        document.body.classList.add('sunny');    
    } else if (condition.includes("cloud")) {
        document.body.classList.add('cloudy');
    } else if (condition.includes("smoke")) {
        document.body.classList.add('haze');
    } else if (condition.includes("haze")) {
        document.body.classList.add('haze');
    } else if (condition.includes("mist")) {
        document.body.classList.add('mist');
    } else if (condition.includes("rain")) {
        document.body.classList.add('rainy');
    } else if (condition.includes("snow")) {
        document.body.classList.add('snowy');
    } else {
        document.body.classList.add('default-weather');
    }
}

function toggleUnit() {
    isCelsius = !isCelsius;
    const unitButton = document.getElementById('unit-toggle');
    unitButton.textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';

    // Re-fetch weather data to update display with new unit
    if (lastSearchedCity) {
        fetchWeatherByCity(lastSearchedCity);
    } else {
        fetchWeatherByLocation();
    }
}

function formatTemperature(temp) {
    if (isCelsius) {
        return `${temp}°C`;
    } else {
        return `${(temp * 9/5 + 32).toFixed(1)}°F`;
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Hide the error message after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Listen for 'Enter' key press in the city input field
document.getElementById('city-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if in a form
        fetchWeatherByCity(); // Trigger the search function
    }
});

window.onload = fetchWeatherByLocation;
