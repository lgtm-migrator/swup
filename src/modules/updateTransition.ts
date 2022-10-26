import Swup from "../index";

const updateTransition = function(this: Swup, from: string, to: string, custom?: any): void {
	// transition routes
	this.transition = {
		from: from,
		to: to,
		custom: custom
	};
};

export default updateTransition;
