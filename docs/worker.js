/*
 * Fri Sep 20 22:35:04 EEST 2024
 */
const version = 4;

const content = [
	'index.html',
	'status.css',
	'styles.css',
	'app.js',
	'agent.js',
	'util.js',
	'icons/app-icon-16.png',
	'icons/app-icon-48.png',
	'icons/app-icon-96.png',
	'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js'
];

const cacheName = `v${version}`;

const cleanupCache = () => caches.keys().then(
	(names) => Promise.all(names.map(
		(name) => (name != cacheName) && caches.delete(name)
	))
);

const fetchData = async (request) => {
	const response = await fetch(request);
	return response;
};

oninstall = (event) => {
	skipWaiting(); // activate the worker immediately w/o waiting

	event.waitUntil(
		caches.open(cacheName).then(
			(cache) => cache.addAll(content)
		)
	);
};

onactivate = (event) => {
	event.waitUntil(clients.claim().then(cleanupCache)); // control all existing clients w/ this worker and cleanup cache
}

onfetch = (event) => {
	event.respondWith(
		caches.match(event.request).then(
			(response) => response || fetchData(event.request)
		)
	);
};
