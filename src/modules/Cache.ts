import { getCurrentUrl, normalizeUrl } from '../helpers.js';
import Swup, {Transition} from "../index";

export type Page = {
    title: string;
    url: string;
    responseURL: string;
    blocks: string[];
    customTransition: Transition;
};
export class Cache {
    private swup: Swup;
    private last: Page | null;
    private pages: Record<string, Page>;

	constructor(swupInstance: Swup) {
		this.pages = {};
		this.last = null;
		this.swup = swupInstance;
	}

	cacheUrl(page: Page) {
		page.url = normalizeUrl(page.url);
		if (page.url in this.pages === false) {
			this.pages[page.url] = page;
		}
		this.last = this.pages[page.url];
		this.swup.log(`Cache (${Object.keys(this.pages).length})`, this.pages);
	}

	getPage(url: string): Page {
		url = normalizeUrl(url);
		return this.pages[url];
	}

	getCurrentPage(): Page {
		return this.getPage(getCurrentUrl());
	}

	exists(url: string): boolean {
		url = normalizeUrl(url);
		return url in this.pages;
	}

	empty(): void {
		this.pages = {};
		this.last = null;
		this.swup.log('Cache cleared');
	}

	remove(url: string): void {
		delete this.pages[url];
	}
}

export default Cache;
