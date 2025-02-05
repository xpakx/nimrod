module.exports = (request, options) => {
	const resolver = options.defaultResolver;
	if (fileInNodeModules(request, options)) return resolver(request, options);
	return tsResolver(request, options);
};

function fileInNodeModules(request, options) {
	return containsNodeModules(options.basedir) || containsNodeModules(request);
}

function containsNodeModules(name) {
	return name.includes("node_modules");
}

function tsResolver(request, options) {
	const resolver = options.defaultResolver;
	const newRequest = request.replace(/\.js$/, ".ts");
	return resolver(newRequest, options);
}
