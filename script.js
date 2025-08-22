// ✅ Put your working key here
const apiKey = "93edc0df67f777b10461298d3e0be117";

// --- universal local fallback icon (always available) ---
const FALLBACK_ICON_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
     <path fill="white" stroke="black" stroke-width="1.5"
           d="M6 19h11a4 4 0 0 0 0-8 6 6 0 0 0-11-2A4 4 0 0 0 6 19z"/>
   </svg>`;
const FALLBACK_ICON = "data:image/svg+xml;utf8," + encodeURIComponent(FALLBACK_ICON_SVG);

// show a visible icon for everyone immediately
document.addEventListener("DOMContentLoaded", () => {
  const iconEl = document.getElementById("icon");
  iconEl.src = FALLBACK_ICON;
});

function showError(msg) {
  document.getElementById("cityName").innerText = msg;
  document.getElementById("temperature").innerText = "-- °C";
  document.getElementById("condition").innerText = "--";
  document.getElementById("feelsLike").innerText = "";
  document.getElementById("humidity").innerText = "";
  document.getElementById("wind").innerText = "";
  const iconEl = document.getElementById("icon");
  iconEl.onerror = null;
  iconEl.src = FALLBACK_ICON; // keep a visible icon even on error
  document.getElementById("forecastContainer").innerHTML = "";
}

function setBackgroundFor(main) {
  const m = (main || "").toLowerCase();
  let bgUrl = "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?auto=format&fit=crop&w=1600&q=80";

  if (m.includes("cloud")) bgUrl = "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1600&q=80";
  else if (m.includes("rain") || m.includes("drizzle")) bgUrl = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80";
  else if (m.includes("snow")) bgUrl = "https://images.unsplash.com/photo-1608889173259-6adf75cfea2d?auto=format&fit=crop&w=1600&q=80";
  else if (m.includes("thunder")) bgUrl = "https://images.unsplash.com/photo-1503437313881-503a91226419?auto=format&fit=crop&w=1600&q=80";
  else if (m.includes("mist") || m.includes("fog") || m.includes("haze")) bgUrl = "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80";

  document.body.style.background = `url('${bgUrl}') no-repeat center center/cover`;
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) { alert("Please enter a city name"); return; }

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  try {
    const [resp, forecastResp] = await Promise.all([ fetch(currentUrl), fetch(forecastUrl) ]);
    const data = await resp.json();

    const cod = String(data.cod || "");
    if (!resp.ok || cod !== "200") {
      const msg = data?.message ? `⚠️ ${data.message}` : "⚠️ Could not fetch weather.";
      showError(msg); return;
    }

    document.getElementById("cityName").innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById("temperature").innerText = `🌡️ ${Math.round(data.main.temp)} °C`;
    document.getElementById("condition").innerText = `🌥️ ${data.weather?.[0]?.description ?? "-"}`;
    document.getElementById("feelsLike").innerText = `🤔 Feels like: ${Math.round(data.main.feels_like)} °C`;
    document.getElementById("humidity").innerText = `💧 Humidity: ${data.main.humidity}%`;
    document.getElementById("wind").innerText = `🌬️ Wind: ${data.wind.speed} m/s`;

    // main icon with robust fallback
    const iconCode = data.weather?.[0]?.icon;
    const iconEl = document.getElementById("icon");
    iconEl.onerror = () => { iconEl.onerror = null; iconEl.src = FALLBACK_ICON; };
    if (iconCode) {
      iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      iconEl.alt = data.weather?.[0]?.description || "Weather icon";
    } else {
      iconEl.src = FALLBACK_ICON;
    }

    setBackgroundFor(data.weather?.[0]?.main);

    // forecast
    const forecastData = await forecastResp.json();
    const forecastContainer = document.getElementById("forecastContainer");
    forecastContainer.innerHTML = "";

    if (forecastResp.ok && String(forecastData.cod) === "200") {
      const daily = forecastData.list.filter(i => i.dt_txt.includes("12:00:00"));
      daily.forEach(day => {
        const date = new Date(day.dt_txt);
        const dayName = date.toLocaleDateString(undefined, { weekday: "short" });

        const card = document.createElement("div");
        card.className = "forecast-day";

        const title = document.createElement("p");
        title.textContent = dayName;

        const img = document.createElement("img");
        img.referrerPolicy = "no-referrer";
        img.crossOrigin = "anonymous";
        img.alt = day.weather?.[0]?.description || "";
        img.onerror = () => { img.onerror = null; img.src = FALLBACK_ICON; };
        img.src = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;

        const temp = document.createElement("p");
        temp.textContent = `${Math.round(day.main.temp)}°C`;

        card.appendChild(title);
        card.appendChild(img);
        card.appendChild(temp);

        forecastContainer.appendChild(card);
      });
    }
  } catch (err) {
    console.error(err);
    showError("⚠️ Network error. Please try again.");
  }
}
