export default class Link {
    link: HTMLAnchorElement | SVGAElement;

	constructor(elementOrUrl: HTMLAnchorElement | SVGAElement | string) {
		if (elementOrUrl instanceof HTMLAnchorElement || elementOrUrl instanceof SVGElement) {
			this.link = elementOrUrl;
		} else {
			this.link = document.createElement('a');
			this.link.href = elementOrUrl;
		}
	}

	getPath() {
		// @ts-ignore this shouldn't work properly for SVG links?
        let path = this.link.pathname;
		if (path[0] !== '/') {
			path = '/' + path;
		}
		return path;
	}

	getAddress() {
        // @ts-ignore this shouldn't work properly for SVG links?
		let path = this.link.pathname + this.link.search;

		if (this.link.getAttribute('xlink:href')) {
			path = this.link.getAttribute('xlink:href');
		}

		if (path[0] !== '/') {
			path = '/' + path;
		}
		return path;
	}

	getHash() {
        // @ts-ignore then this shouldn't work properly for SVG links?
		return this.link.hash;
	}
}
