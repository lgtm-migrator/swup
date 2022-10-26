export const query = (selector: string, context: Document | HTMLElement = document) => {
	if (typeof selector !== 'string') {
		return selector;
	}

	return context.querySelector(selector);
};

export const queryAll = (selector: string, context: Document | HTMLElement = document) => {
	if (typeof selector !== 'string') {
		return selector;
	}

	return Array.from(context.querySelectorAll(selector));
};

export const escapeCssIdentifier = (ident: string) => {
	if (window.CSS?.escape) {
		return window.CSS.escape(ident);
	} else {
		return ident;
	}
};

// Fix for Chrome below v61 formatting CSS floats with comma in some locales
export const toMs = (s: string) => {
	return Number(s.slice(0, -1).replace(',', '.')) * 1000;
};
