type Options = {
    url: string;
    method: 'GET' | 'POST';
    data: any,
    headers: HeadersInit;
};
type Callback = ((response: XMLHttpRequest) => void) | null;
const fetch = (setOptions: Options, callback: Callback = null): XMLHttpRequest => {
	let defaults = {
		url: window.location.pathname + window.location.search,
		method: 'GET',
		data: null,
		headers: {}
	};

	let options = {
		...defaults,
		...setOptions
	};

	let request = new XMLHttpRequest();

	request.onreadystatechange = function() {
		if (request.readyState === 4) {
            if (callback) {
                if (request.status !== 500) {
                    callback(request);
                } else {
                    callback(request);
                }
            }
		}
	};

	request.open(options.method, options.url, true);
	Object.keys(options.headers).forEach((key) => {
        // @ts-ignore not sure what to do about this one
        request.setRequestHeader(key, options.headers[key]);
	});
	request.send(options.data);

	return request;
};

export default fetch;
