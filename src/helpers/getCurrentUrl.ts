const getCurrentUrl = (): string => {
	return window.location.pathname + window.location.search;
};

export default getCurrentUrl;
