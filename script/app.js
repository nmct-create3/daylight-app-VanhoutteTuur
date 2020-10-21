let html, html_sun, html_timeLeft;

// _ = helper functions
function _parseMillisecondsIntoReadableTime(timestamp) {
	//Get hours from milliseconds
	const date = new Date(timestamp * 1000);
	// Hours part from the timestamp
	const hours = "0" + date.getHours();
	// Minutes part from the timestamp
	const minutes = "0" + date.getMinutes();
	// Seconds part from the timestamp (gebruiken we nu niet)
	// const seconds = '0' + date.getSeconds();

	// Will display time in 10:30(:23) format
	return hours.substr(-2) + ":" + minutes.substr(-2); //  + ':' + s
}

function getDOMElements() {
	html = document.querySelector("html");
	// Haal het DOM element van onze zon op en van onze aantal minuten resterend deze dag.
	html_sun = document.querySelector(".js-sun");
	html_timeLeft = document.querySelector(".js-time-left");
}

const getMinutesSinceSunrise = function (sunrise) {
	// calculate seconds since sunrise
	let timeSinceSunrise = Date.now() / 1000 - sunrise;
	// return in minutes
	return timeSinceSunrise / 60;
};

const getPercentages = function (totalMinutes, minutesSinceSunrise) {
	// width: which percentage of the day has been completed?
	let percentage = (minutesSinceSunrise / totalMinutes) * 100;
	// height: the sun is highest in the middle of the day
	// once the sun is past midday, the height gets smaller
	let height = percentage < 50 ? percentage * 2 : (100 - percentage) * 2;

	// the above height declaration is the same as doing this:
	//   let height;
	//   if (percentage < 50){
	//   	height = percentage * 2;
	//   } else {
	//   	height = (100 - percentage) * 2;
	//   }

	// return both the width and height percentages
	return [percentage, height];
};

// update the position of the sun and the text above the sun
const updateSun = function (sun, width, height) {
	// set sun position
	sun.style.left = `${width}%`;
	sun.style.bottom = `${height}%`;

	// set time above sun
	let time = new Date() / 1000;
	sun.dataset.time = _parseMillisecondsIntoReadableTime(time);
};

// update the html_timeLeft text
const updateTimeLeft = function (totalMinutesInDay, minutesSinceSunrise) {
	// get total minutes left until sunrise
	let totalMinutesLeft = Math.round(totalMinutesInDay - minutesSinceSunrise);
	// get amount of hours
	let hoursLeft = Math.floor(totalMinutesLeft / 60);
	// get the minutes
	let minutesLeft = totalMinutesLeft % 60;

	// if totalMinutesLeft > 60, split totalminutesLeft into hours and minutes
	if (totalMinutesLeft > 60) {
		let h = `${hoursLeft} hour${hoursLeft != 1 ? "s" : ""}`;
		let m = `${minutesLeft} minute${minutesLeft != 1 ? "s" : ""}`;
		html_timeLeft.innerText = `${h}, ${m}`;
	} else {
		html_timeLeft.innerText = `${totalMinutesLeft} minute${totalMinutesLeft != 1 ? "s" : ""}`;
	}
};



const updateNightMode = function (totalMinutes, minutesSinceSunrise) {
	if (minutesSinceSunrise > totalMinutes || minutesSinceSunrise < 0) {
		html.classList.add("is-night");
	} else {
		html.classList.remove("is-night");
	}
};

// 4 Zet de zon op de juiste plaats en zorg ervoor dat dit iedere minuut gebeurt.
let placeSunAndStartMoving = (totalMinutes, sunrise) => {
	// get the amount of minutes since sunrise
	let minutesSinceSunrise = getMinutesSinceSunrise(sunrise);
	// if sun not up yet or already set
	updateNightMode(totalMinutes, minutesSinceSunrise);

	// get percentages for where to place the sun
	let percentages = getPercentages(totalMinutes, minutesSinceSunrise);
	let widthPercentage = percentages[0];
	let heightPercentage = percentages[1];

	// Vergeet niet om het resterende aantal minuten in te vullen.
	updateTimeLeft(totalMinutes, minutesSinceSunrise);

	// update the sun position and text
	updateSun(html_sun, widthPercentage, heightPercentage);

	// Nu maken we een functie die de zon elke minuut zal updaten
	const timer = setInterval(() => {
		// update minutesSinceSunrise again
		minutesSinceSunrise = getMinutesSinceSunrise(sunrise);
		// update js-time-left
		updateTimeLeft(totalMinutes, minutesSinceSunrise);
		// update nightmode
		updateNightMode(totalMinutes, minutesSinceSunrise);

		percentages = getPercentages(totalMinutes, minutesSinceSunrise);
		widthPercentage = percentages[0];
		heightPercentage = percentages[1];

		// update sun
		updateSun(html_sun, widthPercentage, heightPercentage);
	}, 1000);
};

// 3 Met de data van de API kunnen we de app opvullen
let showResult = (queryResponse) => {
	console.log(queryResponse);
	// We gaan eerst een paar onderdelen opvullen
	// Zorg dat de juiste locatie weergegeven wordt, volgens wat je uit de API terug krijgt.
	document.querySelector(".js-location").innerText = `${queryResponse.city.name}, ${queryResponse.city.country}`;
	// Toon ook de juiste tijd voor de opkomst van de zon en de zonsondergang.
	document.querySelector(".js-sunrise").innerText = _parseMillisecondsIntoReadableTime(queryResponse.city.sunrise);
	document.querySelector(".js-sunset").innerText = _parseMillisecondsIntoReadableTime(queryResponse.city.sunset);
	// Hier gaan we een functie oproepen die de zon een bepaalde positie kan geven en dit kan updaten.
	// Geef deze functie de periode tussen sunrise en sunset mee en het tijdstip van sunrise.
	const timeDifference = (queryResponse.city.sunset - queryResponse.city.sunrise) / 60;
	placeSunAndStartMoving(timeDifference, queryResponse.city.sunrise);

	// add is-loaded class to body
	document.querySelector("body").classList.add("is-loaded");
};

// 2 Aan de hand van een longitude en latitude gaan we de yahoo wheater API ophalen.
let getAPI = async (lat, lon) => {
	// Met de fetch API proberen we de data op te halen.
	const data = await fetch(
		`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=5ab3cf66921da480525dffd751748008&units=metric&lang=nl&cnt=1`
	)
		.then((r) => r.json())
		.catch((err) => console.error(err));
	// Als dat gelukt is, gaan we naar onze showResult functie.
	showResult(data);
};

document.addEventListener("DOMContentLoaded", function () {
	// load the necessary dom elements
	getDOMElements();
	// 1 We will query the API with longitude and latitude.
	getAPI(50.8027841, 3.2097454);
});
