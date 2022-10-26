import { query, queryAll } from '../utils.js';

const markSwupElements = (element: HTMLElement, containers: string[]) => {
	let blocks: number = 0;

	containers.forEach((selector) => {
		if (query(selector, element) == null) {
			console.warn(`[swup] Container ${selector} not found on page.`);
		} else {
			queryAll(selector).forEach((item, index) => {
				queryAll(selector, element)[index].setAttribute('data-swup', String(blocks));
				blocks++;
			});
		}
	});
};

export default markSwupElements;
