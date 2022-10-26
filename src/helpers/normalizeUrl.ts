import Link from './Link.js';

const normalizeUrl = (url: string): string => {
	return new Link(url).getAddress();
};

export default normalizeUrl;
