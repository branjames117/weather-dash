// grab some selectors
const inputEl = document.querySelector('input');
const errorEl = document.querySelector('#error');
const cityNameEl = document.querySelector('#city-name');

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

// get weather by city function - calls API
function getWeatherByCity(city) {
  fetch(
    'https://api.openweathermap.org/data/2.5/weather?q=' +
      city +
      '&units=imperial&appid=327c433da9985eb244da1437c2c3e4e5'
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {
        const longitude = data.coord.lon;
        const latitude = data.coord.lat;
        // getting UV index requires different API using lat and lon
        getUVIndex(longitude, latitude);

        // with successful query, push to local storage, but only if not already there
        if (citiesHistory.indexOf(city) >= 0) {
        } else {
          citiesHistory.push(city);
          localStorage.setItem('citiesHistory', JSON.stringify(citiesHistory));
          populateHistory();
        }
        // render data to DOM
        document.querySelector('#city-name').innerHTML = `${
          data.name
        } (${new Date(data.dt * 1000)
          .toDateString()
          .slice(4)}) <img src="http://openweathermap.org/img/wn/${
          data.weather[0].icon
        }.png" />`;
        document.querySelector('#temp').textContent =
          'Temp: ' + data.main.temp + ' °F';
        document.querySelector('#wind').textContent =
          'Wind: ' + data.wind.speed + ' MPH';
        document.querySelector('#humidity').textContent =
          'Humidity: ' + data.main.humidity + ' %';
      });
    } else {
      invalidQuery();
    }
  });
}

// get UV index by longitude and lattitude, requires separate fetch request to One Call API
function getUVIndex(longitude, latitude) {
  fetch(
    'https://api.openweathermap.org/data/2.5/onecall?lat=' +
      latitude +
      '&lon=' +
      longitude +
      '&units=imperial&appid=327c433da9985eb244da1437c2c3e4e5'
  ).then((res) => {
    if (res.ok) {
      res.json().then((data) => {
        // one call API also gives us our forecast, so send to be rendered
        getForecast(data.daily);
        document.querySelector(
          '#uvindex'
        ).innerHTML = `UV Index: <span id="uv">${data.current.uvi}</span>`;
        const UVdisplay = document.querySelector('#uv');
        UVdisplay.style.color = 'white';
        switch (Math.floor(data.current.uvi)) {
          case 0:
            UVdisplay.style.backgroundColor = 'blue';
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
            UVdisplay.style.backgroundColor = 'darkyellow';
            break;
          case 5:
            UVdisplay.style.backgroundColor = 'orange';
            break;
          case 6:
            UVdisplay.style.backgroundColor = 'darkorange';
            break;
          case 7:
            UVdisplay.style.backgroundColor = 'red';
            break;
          case 8:
            UVdisplay.style.backgroundColor = 'darkred';
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
      document.querySelector('#uvindex').textContent = 'UV Index: N/A';
    }
  });
}

// get forecast by city function - calls API
function getForecast(forecast) {
  const forecastEl = document.querySelector('#forecast');

  for (let i = 1; i < 6; i++) {
    const forecastCardEl = document.createElement('div');
    forecastCardEl.classList.add('col-5');
    forecastCardEl.classList.add('col-lg-3');
    forecastCardEl.classList.add('col-xl-2');
    forecastCardEl.classList.add('border');
    forecastCardEl.classList.add('rounded');
    forecastCardEl.classList.add('m-2');
    forecastCardEl.innerHTML = `<h3>${new Date(forecast[i].dt * 1000)
      .toDateString()
      .slice(4)}</h3><img src='http://openweathermap.org/img/wn/${
      forecast[i].weather[0].icon
    }.png' /><p>Temp: ${forecast[i].temp.max} °F</p><p>Wind: ${
      forecast[i].wind_speed
    } MPH</p><p>Humidity: ${forecast[i].humidity} %</p>`;

    forecastEl.appendChild(forecastCardEl);
  }
}

// invalid query input
function invalidQuery() {
  inputEl.focus();
  inputEl.style.borderColor = 'red';
  errorEl.textContent = 'Invalid city. Please try again.';
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

// populate history sidebar from localStorage
function populateHistory() {
  const historyEl = document.querySelector('#history');

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

  // pull up the most recent search result
  getWeatherByCity(citiesHistory[citiesHistory.length - 1]);
}

populateHistory();
