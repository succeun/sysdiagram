const replace = require('replace-in-file');
var pkgson = require('../package.json');

const options = {
	files: './dist/sysdiagram*.js',
	from: /{{{version}}}/g,
	to: pkgson.version,
};

replace(options, (error, results) => {
	if (error) {
		return console.error('Error occurred:', error);
	}
	console.log('Replacement results:', results);
});