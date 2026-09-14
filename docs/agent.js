const CONFIG_COOKIE = 'terra';

const storage = window.localStorage;

$.ajaxSetup({
	contentType: 'application/json; charset=UTF-8',
	dataType: 'json',
});

const config = { deployment: '', sheets: [] };

const saveConfig = () => {
	let hash = config.deployment;
	for (const item of config.sheets)
		hash += `+${item.sheet}`;
	document.cookie = `${CONFIG_COOKIE}=${hash}; path=/; max-age=31536000`;
};

const loadConfig = () => {
	const raw = document.cookie
		.split('; ')
		.find(item => item.startsWith(`${CONFIG_COOKIE}=`));
	if (!raw) return;

	const [ deployment, ...sheets ] = raw.slice(CONFIG_COOKIE.length + 1).split('+');

	config.deployment = deployment;
	config.sheets = sheets.map(sheet => ({ sheet }));
};

loadConfig();

const url = () => {
	if (config.deployment)
		return `https://script.google.com/macros/s/${config.deployment}/exec`;

	throw Error('deployment ID not defined.');
};

const getSheetAsync = (sheet) => new Promise((resolve, reject) => {
	console.log(`Get sheet ${sheet}`);

	$.get(url(), { x: sheet })
		.done((data) => { storage.setItem(sheet, JSON.stringify(data)); resolve(data); })
		.fail(() => { reject(new Error(`Get sheet ${sheet} failed.`)); });
});

export const ok = () => config.deployment && true;

export const getDeployment = () => config.deployment;

export const setDeployment = (deployment) => { config.deployment = deployment; saveConfig(); };

/**
 * Returns an array of { sheet } objects.
 */
export const getSheets = () => config.sheets;

export const addSheetAsync = async (sheet) => {
	console.log(`Add sheet ${sheet}`);

	if (config.sheets.find(item => item.sheet == sheet))
		throw Error('sheet already exists.');

	const data = await getSheetAsync(sheet);
	config.sheets.push({ sheet });
	saveConfig();
	return data;
};

export const removeSheet = (sheet) => {
	console.log(`Remove sheet ${sheet}`);

	const index = config.sheets.findIndex(item => item.sheet == sheet);
	if (index >= 0) {
		config.sheets.splice(index, 1);
		saveConfig();

		storage.removeItem(sheet);
	}
};

export const readSheetAsync = async (sheet) => {
	const raw = storage.getItem(sheet);
	if (raw)
		return JSON.parse(raw);

	return getSheetAsync(sheet);
};

export const refreshSheetAsync = async (sheet) => {
	const item = config.sheets.find(item => item.sheet == sheet);
	if (item) {
		return getSheetAsync(sheet);
	}

	throw Error('sheet not found.');

};

export const setSheetAsync = (sheet, location, accommodation, status, note) => new Promise((resolve, reject) => {
	$.get(url(), { x: sheet, l: location, a: accommodation, s: status, n: note })
		.done((row) => {
			const raw = storage.getItem(sheet);
			if (raw) {
				const data = JSON.parse(raw);
				data.locations[location].accommodations[accommodation] = row;
				storage.setItem(sheet, JSON.stringify(data));
			}
			resolve(row);
		})
		.fail((a, b, c) => {
			reject();
		});
});

export const importConfigAsync = async (hash) => {
	console.log('Importing config');

	const [ deployment, ...sheets ] = hash.split('+');

	config.deployment = deployment.substr(1);
	saveConfig();

	for (const item of config.sheets.slice()) {
		if (!sheets.find(sheet => sheet == item.sheet))
			removeSheet(item.sheet);
	}

	for (const sheet of sheets) {
		if (!config.sheets.find(item => item.sheet == sheet)) {
			const local = new String(sheet);
			await addSheetAsync(local).catch((err) => {
				console.error(err);
			});
		}
	}
};
