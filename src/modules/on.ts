import Swup, {EventHandler, EventTypes} from "../index";

const on = function on(this: Swup, event: EventTypes, handler: EventHandler) {
	if (this._handlers[event]) {
		this._handlers[event].push(handler);
	} else {
		console.warn(`Unsupported event ${event}.`);
	}
};

export default on;
