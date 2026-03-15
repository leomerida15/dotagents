/**
 * Lightweight Observable implementation for event streams.
 * Provides subscription, unsubscription, and debouncing operators.
 */

/**
 * Observer interface for receiving events.
 */
export interface Observer<T> {
	/** Called when a new value is emitted */
	next?: (value: T) => void;
	/** Called when an error occurs */
	error?: (error: Error) => void;
	/** Called when the observable completes */
	complete?: () => void;
}

/**
 * Subscription interface for managing an active subscription.
 */
export interface Subscription {
	/** Unsubscribe from the observable */
	unsubscribe(): void;
	/** Check if still subscribed */
	get closed(): boolean;
}

/**
 * Simple Observable implementation with debounce support.
 */
export class Observable<T> {
	private subscribers: Array<{ observer: Observer<T>; subscription: Subscription }> = [];
	private isCompleted = false;

	constructor(private subscribeFn?: (observer: Observer<T>) => (() => void) | void) {}

	/**
	 * Subscribe to the observable.
	 * @param observer - Observer object or next callback function
	 */
	subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
		if (this.isCompleted) {
			throw new Error('Cannot subscribe to a completed observable');
		}

		const normalizedObserver: Observer<T> =
			typeof observer === 'function' ? { next: observer } : observer;

		let unsubscribed = false;
		let teardown: (() => void) | void;

		const subscription: Subscription = {
			unsubscribe: () => {
				if (unsubscribed) return;
				unsubscribed = true;

				const index = this.subscribers.findIndex((s) => s.subscription === subscription);
				if (index !== -1) {
					this.subscribers.splice(index, 1);
				}

				if (teardown) {
					teardown();
				}
			},
			get closed() {
				return unsubscribed;
			},
		};

		this.subscribers.push({ observer: normalizedObserver, subscription });

		if (this.subscribeFn) {
			teardown = this.subscribeFn(normalizedObserver);
		}

		return subscription;
	}

	/**
	 * Emit a value to all subscribers.
	 */
	next(value: T): void {
		if (this.isCompleted) return;

		for (const { observer } of this.subscribers) {
			try {
				observer.next?.(value);
			} catch (error) {
				observer.error?.(error as Error);
			}
		}
	}

	/**
	 * Emit an error to all subscribers.
	 */
	error(error: Error): void {
		if (this.isCompleted) return;

		for (const { observer } of this.subscribers) {
			observer.error?.(error);
		}
	}

	/**
	 * Complete the observable and notify all subscribers.
	 */
	complete(): void {
		if (this.isCompleted) return;
		this.isCompleted = true;

		for (const { observer } of this.subscribers) {
			observer.complete?.();
		}
		this.subscribers = [];
	}

	/**
	 * Create an observable that emits values with debouncing.
	 * @param delayMs - Debounce delay in milliseconds
	 */
	debounceTime(delayMs: number): Observable<T> {
		return new Observable<T>((observer) => {
			let timeoutId: Timer | null = null;
			let latestValue: T;

			const subscription = this.subscribe({
				next: (value) => {
					latestValue = value;
					if (timeoutId) {
						clearTimeout(timeoutId);
					}
					timeoutId = setTimeout(() => {
						observer.next?.(latestValue);
					}, delayMs);
				},
				error: (error) => observer.error?.(error),
				complete: () => {
					if (timeoutId) {
						clearTimeout(timeoutId);
						observer.next?.(latestValue);
					}
					observer.complete?.();
				},
			});

			return () => subscription.unsubscribe();
		});
	}

	/**
	 * Create a simple observable from an event emitter pattern.
	 */
	static fromEvent<E extends Event>(target: EventTarget, eventName: string): Observable<E> {
		return new Observable<E>((observer) => {
			const handler = (event: Event) => {
				observer.next?.(event as E);
			};

			target.addEventListener(eventName, handler);

			return () => {
				target.removeEventListener(eventName, handler);
			};
		});
	}
}
