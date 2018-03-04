
(function () {
  'use strict';

  var weatherAPIUrlBase = 'http://127.0.0.1:9800';
  var idb, dbObject, transaction, objectStore, request;

  idb = indexedDB.open('forecasts');
  idb.onsuccess = function (evt) {
    dbObject = evt.target.result;
    transaction = dbObject.transaction(['cities'], 'readonly');
    objectStore = transaction.objectStore('cities');
    request = objectStore.getAll();
    request.onsuccess = function (resp) {
      resp.target.result.forEach(city => app.getForecast(city.key, city.label))
    }
  }

  idb.onupgradeneeded = function (evt) {
    if (evt.oldVersion < 1) {
      if (!dbObject) {
        // console.log('onUpgradeFirst!');
        dbObject = evt.target.result;
      }
      dbObject.createObjectStore('cities', { autoIncrement: true });
    }
  }

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById('butRefresh').addEventListener('click', function () {
    app.updateForecasts();
  });

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function () {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add city button in add city dialog */
  document.getElementById('butAddCity').addEventListener('click', function () {
    var select = document.getElementById('selectCityToAdd');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    app.getForecast(key, label);
    app.selectedCities.push({ key: key, label: label });
    app.toggleAddDialog(false);
    transaction = dbObject.transaction(['cities'], 'readwrite');
    objectStore = transaction.objectStore('cities');
    var cityToBeAdded = { key, label };
    // Save the entry object
    request = objectStore.getAll();
    request.onsuccess = function (resp) {
      if (!resp.target.result.some(city => city.label === cityToBeAdded.label)) {
        objectStore.add(cityToBeAdded);
      }
    }
    request.onerror = function (err) {
      console.log(err);
    }
  });

  /* Event listener for cancel button in add city dialog */
  document.getElementById('butAddCancel').addEventListener('click', function () {
    app.toggleAddDialog(false);
  });


  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function (visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function (data) {
    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.label;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }
    card.querySelector('.description').textContent = data.currently.summary;
    card.querySelector('.date').textContent =
      new Date(data.currently.time * 1000);
    card.querySelector('.current .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent =
      Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent =
      Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent =
      Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent =
      Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent =
      data.currently.windBearing;
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if (daily && nextDay) {
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.temperatureMin);
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function (key, label) {
    var url = weatherAPIUrlBase + '?' + key;
    if('caches' in window) {
      caches.match(url).then(response => {
        if(response) {
          response.json().then(json => {
            app.updateForecastCard(Object.assign(json,{key, label}));
          })
        }
      })
    }
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          response.key = key;
          response.label = label;
          app.updateForecastCard(response);
        }
      }
    };
    request.open('GET', url);
    request.send();
    // fetch(url).then(response => response.json()).then(data => app.updateForecastCard(Object.assign(data, {key, label})))
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function () {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function (key) {
      app.getForecast(key);
    });
  };

  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(function(register) {
        console.log('register', register);
      })
  }

})();
