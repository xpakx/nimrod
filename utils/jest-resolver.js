module.exports = (request, options) => {
	let resolvedPath = options.defaultResolver(request, options);

	if (!resolvedPath.includes("node_modules") && resolvedPath.endsWith(".js")) {
		const tsPath = resolvedPath.replace(/\.js$/, ".ts");
		return tsPath;
	}

	return resolvedPath;
};

