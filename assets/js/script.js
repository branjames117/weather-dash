// grab some selectors
const inputEl = document.querySelector('input');
const errorEl = document.querySelector('#error');
const cityNameEl = document.querySelector('#city-name');
const historyEl = document.querySelector('#history');
const mainWeatherContainerEl = document.querySelector('#weather-container');
const UVdisplay = document.querySelector('#uv');
const forecastEl = document.querySelector('#forecast');

// immediately focus the input field
inputEl.focus();

// remove error state when user begins input
inputEl.addEventListener('keypress', function () {
  inputEl.style.borderColor = 'black';
  errorEl.textContent = '';
});

// initialize localStorage array
let citiesHistory = [];
// if it doesn't exist, create it
if (!localStorage.citiesHistory) {
  localStorage.setItem('citiesHistory', JSON.stringify(citiesHistory));
}
// pull from local storage
citiesHistory = JSON.parse(localStorage.citiesHistory);

// clear history button
document.querySelector('#clear-history').addEventListener('click', function () {
  citiesHistory = [];
  localStorage.setItem('citiesHistory', JSON.stringify(citiesHistory));
  // clear the previous history
  clearHistoryElements();
});

function clearHistoryElements() {
  while (historyEl.lastChild) {
    historyEl.removeChild(historyEl.lastChild);
  }
}

// get weather by city function - calls API and also updates history in local storage
function getWeatherByCity(city) {
  // show Loading indication
  cityNameEl.textContent = 'Loading...';

  // fetch data from
  fetch(
    'https://api.openweathermap.org/data/2.5/weather?q=' +
      city +
      '&units=imperial&appid=ef0ef45aa47279ba07daa36096cacfa0'
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {
        // clear out any potential errors in search box
        inputEl.style.borderColor = '';
        errorEl.textContent = '';
        const longitude = data.coord.lon;
        const latitude = data.coord.lat;
        // getting UV index requires different API using lat and lon
        getUVIndex(longitude, latitude);

        // set container background based on icon
        const icon = data.weather[0].icon;
        setContainerBackground(icon);

        // filter city out of history if it's already there
        citiesHistory = citiesHistory.filter((city) => city !== data.name);

        // if history is 20 items long already, drop the oldest one
        if (citiesHistory.length === 20) {
          citiesHistory.shift();
        }

        // push city to local storage and populate HTML elements
        citiesHistory.push(data.name);
        localStorage.setItem('citiesHistory', JSON.stringify(citiesHistory));
        populateHistory();

        // render data to DOM
        document.querySelector('#city-name').innerHTML = `${
          data.name
        } (${new Date(data.dt * 1000)
          .toDateString()
          .slice(4)}) <img src="http://openweathermap.org/img/wn/${
          data.weather[0].icon
        }.png" />`;
        document.querySelector('#temp').textContent = data.main.temp + ' °F';
        document.querySelector('#wind').textContent = data.wind.speed + ' MPH';
        document.querySelector('#humidity').textContent =
          data.main.humidity + ' %';
      });
      // oops, too many API requests
    } else if (res.status === 429) {
      invalidQuery('API limit exceeded. Please try again later.');
      throw Error(res.statusText);
      // oops, input didn't match a city in API
    } else {
      invalidQuery('Invalid entry. Please try something else.');
      throw Error(res.statusText);
    }
  });
}

function fetchErrorDisplay() {}

// get UV index by longitude and lattitude, requires separate fetch request to One Call API
function getUVIndex(longitude, latitude) {
  fetch(
    'https://api.openweathermap.org/data/2.5/onecall?lat=' +
      latitude +
      '&lon=' +
      longitude +
      '&units=imperial&appid=ef0ef45aa47279ba07daa36096cacfa0'
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {
        // one call API also gives us our forecast, so send to be rendered
        getForecast(data.daily);
        UVdisplay.textContent = `${data.current.uvi}`;

        // handle UV background color logic
        UVdisplay.style.color = 'black';
        switch (Math.floor(data.current.uvi)) {
          case 0:
            UVdisplay.style.backgroundColor = 'blue';
            UVdisplay.style.color = 'white';
            break;
          case 1:
            UVdisplay.style.backgroundColor = 'green';
            break;
          case 2:
            UVdisplay.style.backgroundColor = 'lightgreen';
            break;
          case 3:
            UVdisplay.style.backgroundColor = 'yellow';
            break;
          case 4:
            UVdisplay.style.backgroundColor = 'goldenrod';
            break;
          case 5:
            UVdisplay.style.backgroundColor = 'orange';
            break;
          case 6:
            UVdisplay.style.backgroundColor = 'darkorange';
            break;
          case 7:
            UVdisplay.style.backgroundColor = 'red';
            UVdisplay.style.color = 'white';
            break;
          case 8:
            UVdisplay.style.backgroundColor = 'darkred';
            UVdisplay.style.color = 'white';
            break;
          case 9:
            UVdisplay.style.backgroundColor = 'pink';
            break;
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
          case 15:
            UVdisplay.style.backgroundColor = 'violet';
            break;
        }
      });
    } else {
      UVdisplay.textContent = 'N/A';
    }
  });
}

// get forecast by city function - calls API
function getForecast(forecast) {
  // clear the previous history
  while (forecastEl.lastChild) {
    forecastEl.removeChild(forecastEl.lastChild);
  }

  for (let i = 1; i < 6; i++) {
    const forecastCardEl = document.createElement('div');
    forecastCardEl.classList = 'col-4 col-lg-3 col-xl-2 m-2 p-0';
    forecastCardEl.innerHTML = `<h3>${new Date(forecast[i].dt * 1000)
      .toDateString()
      .slice(4, -4)}</h3><img src='http://openweathermap.org/img/wn/${
      forecast[i].weather[0].icon
    }.png' /><p>Temp: ${forecast[i].temp.max} °F</p><p>Wind: ${
      forecast[i].wind_speed
    } <small>MPH</small></p><p>Humidity: ${forecast[i].humidity} %</p>`;

    forecastEl.appendChild(forecastCardEl);
  }

  const extraEl = document.createElement('div');
  extraEl.classList = 'col-4 col-lg-3 col-xl-2 m-2 p-0';
  forecastEl.appendChild(extraEl);
}

// invalid query input
function invalidQuery(msg) {
  // reset all elements
  cityNameEl.textContent = 'Fetch failed...';
  mainWeatherContainerEl.style.background = '';
  document.querySelector('#temp').textContent = '';
  document.querySelector('#wind').textContent = '';
  document.querySelector('#humidity').textContent = '';
  document.querySelector('#uv').textContent = '';
  // clear out the forecast
  while (forecastEl.lastChild) {
    forecastEl.removeChild(forecastEl.lastChild);
  }
  // refocus search bar and highlight red, add err msg underneath
  inputEl.focus();
  inputEl.style.borderColor = 'red';
  errorEl.textContent = msg;
}

// form submit listener
const formEl = document.querySelector('form');
formEl.addEventListener('submit', (e) => {
  e.preventDefault();

  // get value entered into search box
  const queriedCity = document.querySelector('#search-input').value;

  // pass requested city to API request functions
  getWeatherByCity(queriedCity);

  // clear search input
  inputEl.value = '';
});

// set container background per icon
function setContainerBackground(icon) {
  switch (icon) {
    // generally sunny conditions
    case '01d':
    case '02d':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/sunny.jpg")';
      break;
    // generally cloudy conditions
    case '03d':
    case '04d':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/cloudy.jpg")';
      break;
    // generally rainy conditions
    case '09d':
    case '10d':
    case '50d':
    case '50n':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/rainy.jpg")';
      break;
    // generally stormy conditions
    case '11d':
    case '11n':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/storm.jpg")';
      break;
    // generally snowy conditions
    case '13d':
    case '13n':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/snowy.jpg")';
      break;
    // it's night so just show some stars
    case '01n':
    case '02n':
    case '03n':
    case '04n':
    case '09n':
    case '10n':
      mainWeatherContainerEl.style.background =
        'url("./assets/images/night.jpg")';
      break;
  }
}

// populate history sidebar from localStorage
function populateHistory() {
  // clear the previous history
  while (historyEl.lastChild) {
    historyEl.removeChild(historyEl.lastChild);
  }

  for (let i = citiesHistory.length - 1, k = 0; i >= 0 && k < 10; i--, k++) {
    const historyButtonEl = document.createElement('button');
    historyButtonEl.classList.add('btn');
    historyButtonEl.classList.add('btn-primary');
    historyButtonEl.classList.add('w-100');
    historyButtonEl.classList.add('mt-1');
    historyButtonEl.textContent = citiesHistory[i];
    historyButtonEl.addEventListener('click', function () {
      getWeatherByCity(citiesHistory[i]);
    });

    historyEl.append(historyButtonEl);
  }
}

populateHistory();
