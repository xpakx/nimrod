const path = require("path");

module.exports = (request, options) => {
	const resolver = options.defaultResolver;
	const baseDirHasNodeModules = options.basedir.includes("node_modules");
	const requestHasNodeModules = request.includes("node_modules");
	const inNodeModules = baseDirHasNodeModules || requestHasNodeModules;

	if (inNodeModules) return resolver(request, options);
	const newRequest = request.replace(/\.js$/, ".ts");
	return resolver(newRequest, options);

};

