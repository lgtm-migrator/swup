import delegate from 'delegate-it';

// modules
import Cache from './modules/Cache';
import loadPage from './modules/loadPage';
import renderPage from './modules/renderPage';
import triggerEvent from './modules/triggerEvent';
import on from './modules/on';
import off from './modules/off';
import updateTransition from './modules/updateTransition';
import getAnchorElement from './modules/getAnchorElement';
import getAnimationPromises from './modules/getAnimationPromises';
import getPageData from './modules/getPageData';
import { use, unuse, findPlugin } from './modules/plugins';

import { queryAll } from './utils';
import {
	getCurrentUrl,
	markSwupElements,
	Link,
	cleanupAnimationClasses
} from './helpers.js';

export type PluginInstance = {
    name: string;
    isSwupPlugin: true;
    swup: Swup;
    mount: () => void;
    unmount: () => void;
    _beforeMount?: () => void;
    _afterUnmount?: () => void;
};
type Options = {
    animateHistoryBrowsing: boolean,
    animationSelector: string,
    linkSelector: string,
    cache: boolean,
    containers: string[],
    requestHeaders: HeadersInit,
    plugins: PluginInstance[],
    skipPopStateHandling: (event: PopStateEvent) => boolean;
};
export type EventTypes = | 'animationInDone'
    | 'animationInStart'
    | 'animationOutDone'
    | 'animationOutStart'
    | 'animationSkipped'
    | 'clickLink'
    | 'contentReplaced'
    | 'disabled'
    | 'enabled'
    | 'openPageInNewTab'
    | 'pageLoaded'
    | 'pageRetrievedFromCache'
    | 'pageView'
    | 'popState'
    | 'samePage'
    | 'samePageWithHash'
    | 'serverError'
    | 'transitionStart'
    | 'transitionEnd'
    | 'willReplaceContent';
export type EventHandlerEventType = MouseEvent | PopStateEvent;
export type EventHandler = (event?: EventHandlerEventType) => void;
export type Transition = {
    from?: string;
    to?: string;
    custom?: any;
};
interface DelegateMouseEvent extends MouseEvent { delegateTarget: Element };
interface PreloadPromise extends Promise<Response> {
    route: string
};

export default class Swup {
    _handlers: Record<EventTypes, EventHandler[]>;

    private readonly delegatedListeners: Record<any, any>;
    public scrollToElement: HTMLElement | null = null;
    public preloadPromise: PreloadPromise | null = null;
    public plugins: PluginInstance[];
    public transition: Transition;
    private boundPopStateHandler: OmitThisParameter<(event: any) => void>;
    public options: Options;
    public  cache: Cache;

    private readonly loadPage: typeof loadPage;
    private readonly renderPage: typeof renderPage
    private readonly on: typeof on
    private readonly off: typeof off
    private readonly getPageData: typeof getPageData
    private readonly getAnchorElement: typeof getAnchorElement
    private readonly use: typeof use
    private readonly unuse: typeof unuse
    private readonly findPlugin: typeof findPlugin
    public updateTransition: typeof updateTransition
    public log = (message: string, context?: any) => {}; // here so it can be us: typeof by lugins
    public getAnimationPromises: typeof getAnimationPromises
    public cleanupAnimationClasses: typeof cleanupAnimationClasses
    public triggerEvent: typeof triggerEvent
    public getCurrentUrl: typeof getCurrentUrl

	constructor(setOptions: Options) {
		// default options
		let defaults = {
			animateHistoryBrowsing: false,
			animationSelector: '[class*="transition-"]',
			linkSelector: `a[href^="${
				window.location.origin
			}"]:not([data-no-swup]), a[href^="/"]:not([data-no-swup]), a[href^="#"]:not([data-no-swup])`,
			cache: true,
			containers: ['#swup'],
			requestHeaders: {
				'X-Requested-With': 'swup',
				Accept: 'text/html, application/xhtml+xml'
			},
			plugins: [],
			skipPopStateHandling: function(event: PopStateEvent) {
				return !(event.state && event.state.source === 'swup');
			}
		};

		// merge options
		const options = {
			...defaults,
			...setOptions
		};

		// handler arrays
		this._handlers = {
			animationInDone: [],
			animationInStart: [],
			animationOutDone: [],
			animationOutStart: [],
			animationSkipped: [],
			clickLink: [],
			contentReplaced: [],
			disabled: [],
			enabled: [],
			openPageInNewTab: [],
			pageLoaded: [],
			pageRetrievedFromCache: [],
			pageView: [],
			popState: [],
			samePage: [],
			samePageWithHash: [],
			serverError: [],
			transitionStart: [],
			transitionEnd: [],
			willReplaceContent: []
		};

		// variable for anchor to scroll to after render
		this.scrollToElement = null;
		// variable for promise used for preload, so no new loading of the same page starts while page is loading
		this.preloadPromise = null;
		// variable for save options
		this.options = options;
		// variable for plugins array
		this.plugins = [];
		// variable for current transition object
		this.transition = {};
		// variable for keeping event listeners from "delegate"
		this.delegatedListeners = {};
		// so we are able to remove the listener
		this.boundPopStateHandler = this.popStateHandler.bind(this);

		// make modules accessible in instance
		this.cache = new Cache(this);
		this.loadPage = loadPage;
		this.renderPage = renderPage;
		this.triggerEvent = triggerEvent;
		this.on = on;
		this.off = off;
		this.updateTransition = updateTransition;
		this.getAnimationPromises = getAnimationPromises;
		this.getPageData = getPageData;
		this.getAnchorElement = getAnchorElement;
		this.log = () => {}; // here so it can be used by plugins
		this.use = use;
		this.unuse = unuse;
		this.findPlugin = findPlugin;
		this.getCurrentUrl = getCurrentUrl;
		this.cleanupAnimationClasses = cleanupAnimationClasses;

		// enable swup
		this.enable();
	}

	enable() {
		// check for Promise support
		if (typeof Promise === 'undefined') {
			console.warn('Promise is not supported');
			return;
		}

		// add event listeners
		this.delegatedListeners.click = delegate(
			document,
			this.options.linkSelector,
			'click',
			this.linkClickHandler.bind(this)
		);
		window.addEventListener('popstate', this.boundPopStateHandler);

		// initial save to cache
		if (this.options.cache) {
			// disabled to avoid caching modified dom state
			// https://github.com/swup/swup/issues/475
			// logic moved to preload plugin
		}

		// mark swup blocks in html
		markSwupElements(document.documentElement, this.options.containers);

		// mount plugins
		this.options.plugins.forEach((plugin) => {
			this.use(plugin);
		});

		// modify initial history record
		window.history.replaceState(
			Object.assign({}, window.history.state, {
				url: window.location.href,
				random: Math.random(),
				source: 'swup'
			}),
			document.title,
			window.location.href
		);

		// trigger enabled event
		this.triggerEvent('enabled');

		// add swup-enabled class to html tag
		document.documentElement.classList.add('swup-enabled');

		// trigger page view event
		this.triggerEvent('pageView');
	}

	destroy() {
		// remove delegated listeners
		this.delegatedListeners.click.destroy();

		// remove popstate listener
		window.removeEventListener('popstate', this.boundPopStateHandler);

		// empty cache
		this.cache.empty();

		// unmount plugins
		this.options.plugins.forEach((plugin) => {
			this.unuse(plugin);
		});

		// remove swup data atributes from blocks
		queryAll('[data-swup]').forEach((element: Element) => {
			element.removeAttribute('data-swup');
		});

		// remove handlers
		this.off();

		// trigger disable event
		this.triggerEvent('disabled');

		// remove swup-enabled class from html tag
		document.documentElement.classList.remove('swup-enabled');
	}

	linkClickHandler(event: DelegateMouseEvent) {
		// no control key pressed
		if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
			// index of pressed button needs to be checked because Firefox triggers click on all mouse buttons
			if (event.button === 0) {
				this.triggerEvent('clickLink', event);
				event.preventDefault();
				const link = new Link(event.delegateTarget);
				if (link.getAddress() == getCurrentUrl() || link.getAddress() == '') {
					// link to the same URL
					if (link.getHash() != '') {
						// link to the same URL with hash
						this.triggerEvent('samePageWithHash', event);
						const element = getAnchorElement(link.getHash());
						if (element != null) {
							history.replaceState(
								{
									url: link.getAddress() + link.getHash(),
									random: Math.random(),
									source: 'swup'
								},
								document.title,
								link.getAddress() + link.getHash()
							);
						} else {
							// referenced element not found
							console.warn(`Element for offset not found (${link.getHash()})`);
						}
					} else {
						// link to the same URL without hash
						this.triggerEvent('samePage', event);
					}
				} else {
					// link to different url
					if (link.getHash() != '') {
						this.scrollToElement = link.getHash();
					}

					// get custom transition from data
					let customTransition = event.delegateTarget.getAttribute(
						'data-swup-transition'
					);

					// load page
					this.loadPage(
						{ url: link.getAddress(), customTransition: customTransition },
						false
					);
				}
			}
		} else {
			// open in new tab (do nothing)
			this.triggerEvent('openPageInNewTab', event);
		}
	}

	popStateHandler(event: PopStateEvent) {
		if (this.options.skipPopStateHandling(event)) return;
		const link = new Link(event.state ? event.state.url : window.location.pathname);
		if (link.getHash() !== '') {
			this.scrollToElement = link.getHash();
		} else {
			event.preventDefault();
		}
		this.triggerEvent('popState', event);

		if (!this.options.animateHistoryBrowsing) {
			document.documentElement.classList.remove('is-animating');
			cleanupAnimationClasses();
		}

		this.loadPage({ url: link.getAddress() }, event);
	}
}
