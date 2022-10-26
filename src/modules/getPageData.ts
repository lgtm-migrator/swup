import { getDataFromHtml } from '../helpers.js';
import { Page } from "./Cache";
import Swup from "../index";

const getPageData = function(this: Swup, request: XMLHttpRequest): Partial<Page> | null {
	// this method can be replaced in case other content than html is expected to be received from server
	// this function should always return {title, pageClass, originalContent, blocks, responseURL}
	// in case page has invalid structure - return null
	const html = request.responseText;
	let pageObject = getDataFromHtml(html, this.options.containers);

	if (pageObject) {
		pageObject.responseURL = request.responseURL ? request.responseURL : window.location.href;
	} else {
		console.warn('[swup] Received page is invalid.');
		return null;
	}

	return pageObject;
};

export default getPageData;
