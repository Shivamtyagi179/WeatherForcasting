const weatherMap = {
  0: ['Clear', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁️'], 45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Moderate drizzle', '🌦️'],
  55: ['Dense drizzle', '🌧️'], 61: ['Slight rain', '🌧️'],
  63: ['Moderate rain', '🌧️'], 65: ['Heavy rain', '⛈️'],
  71: ['Slight snow', '🌨️'], 73: ['Moderate snow', '🌨️'],
  75: ['Heavy snow', '❄️'], 77: ['Snow grains', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Moderate showers', '🌦️'],
  82: ['Violent showers', '⛈️'], 85: ['Snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'], 95: ['Thunderstorm', '⛈️']
};

const el = id => document.getElementById(id);
const searchBtn = el('searchBtn');
const cityInput = el('cityInput');
const currentCity = el('currentCity');
const currentTemp = el('currentTemp');
const currentDesc = el('currentDesc');
const currentMeta = el('currentMeta');
const updateTime = el('updateTime');
const forecastEl = el('forecast');
const errorEl = el('error');

function cToF(c) { return (c*9/5+32).toFixed(1); }

function setDayNightBackground(weatherCode = null) {
  const hour = new Date().getHours();
  const body = document.body;
  body.className = "";

  // Day/Night
  if (hour >= 6 && hour < 18) body.classList.add("day");
  else body.classList.add("night");

  // Weather override
  if (weatherCode !== null) {
    if ([0,1].includes(weatherCode)) body.classList.add("sunny");
    else if ([2,3,45,48].includes(weatherCode)) body.classList.add("cloudy");
    else if ([51,53,55,61,63,65,80,81,82,95].includes(weatherCode)) body.classList.add("rainy");
    else if ([71,73,75,77,85,86].includes(weatherCode)) body.classList.add("snowy");
  }
}

async function lookupAndRender(city){
  errorEl.style.display='none';
  try{
    currentCity.textContent = `Searching '${city}'...`;

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoResp = await fetch(geoUrl);
    const geo = await geoResp.json();
    if(!geo.results || geo.results.length===0) throw new Error('City not found');
    const {latitude, longitude, name, country} = geo.results[0];

    const daily = 'temperature_2m_max,temperature_2m_min,weathercode';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=${daily}&current_weather=true&timezone=auto`;
    const resp = await fetch(url);
    const data = await resp.json();

    const cw = data.current_weather;
    const units = el('units').value;
    let temp = cw.temperature;
    let tempStr = units==='c' ? `${temp.toFixed(1)}°C` : `${cToF(temp)}°F`;
    const wc = weatherMap[cw.weathercode] || ['Unknown','❓'];

    currentCity.textContent = `${name}, ${country}`;
    currentTemp.textContent = tempStr;
    currentDesc.textContent = `${wc[1]} ${wc[0]}`;
    currentMeta.textContent = `Wind: ${cw.windspeed} km/h | Wind dir: ${cw.winddirection}°`;
    updateTime.textContent = `Last update: ${cw.time}`;

    setDayNightBackground(cw.weathercode);

    forecastEl.innerHTML='';
    const days = data.daily.time;
    const tmax = data.daily.temperature_2m_max;
    const tmin = data.daily.temperature_2m_min;
    const wcode = data.daily.weathercode;

    for(let i=0;i<days.length;i++){
      const d = document.createElement('div');
      d.className='day';
      const code = wcode[i];
      const desc = weatherMap[code] ? weatherMap[code][0] : '—';
      const emoji = weatherMap[code] ? weatherMap[code][1] : '—';
      const max = units==='c' ? tmax[i].toFixed(1) : cToF(tmax[i]);
      const min = units==='c' ? tmin[i].toFixed(1) : cToF(tmin[i]);
      d.innerHTML = `
        <div style="font-weight:700">${new Date(days[i]).toLocaleDateString()}</div>
        <div style="font-size:28px;margin:6px 0">${emoji}</div>
        <div class="small">${desc}</div>
        <div style="margin-top:8px">Max: ${max}° | Min: ${min}°</div>
      `;
      forecastEl.appendChild(d);
    }

  }catch(err){
    errorEl.style.display='block';
    errorEl.textContent = 'Error: '+err.message;
    console.error(err);
    setDayNightBackground();
  }
}

searchBtn.addEventListener('click', ()=>lookupAndRender(cityInput.value.trim()));
cityInput.addEventListener('keyup', (e)=>{if(e.key==='Enter') lookupAndRender(cityInput.value.trim())});

lookupAndRender(cityInput.value);
setInterval(()=>setDayNightBackground(), 30*60*1000);
// Update background every 30 minutes
// Initial background set
setDayNightBackground();

// End of script.js