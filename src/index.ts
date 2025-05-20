/**
 * A Result type representing either a successful operation with data T,
 * or a failed operation with error E.
 */
export type Result<T, E> = [true, T] | [false, E];

/**
 * An Option type representing either a present value T,
 * or absence of a value.
 */
type Option<T> = [true, T] | [false];

/**
 * Response from the users device to a setup request.
 * The digits must be verified on the server and the
 * Setup Complete endpoint of the HENNGE Lock Server
 * must be called with the verification result.
 * The device type is informational and may be stored
 * to provide a better user experience.
 */
export interface Setup {
	digits: string;
	deviceType: string;
}

/**
 * Error type for timeout conditions.
 */
export interface TimeoutError {
	type: "timeout";
}

/**
 * Error type for HTTP-related errors.
 */
export interface HttpError {
	type: "http";
	response: Response;
}

/**
 * Error type for unexpected or unhandled errors.
 */
export interface UnknownError {
	type: "unknown";
	error: unknown;
}

/**
 * Union type of all possible lock operation errors.
 */
export type LockError = TimeoutError | HttpError | UnknownError;

/**
 * Initiates the setup process by making requests to the provided URL.
 * Continues polling until a valid response is received or the operation
 * times out.
 *
 * @param url Returned from the Setup Init endpoint of the HENNGE Lock Server
 * @returns A Result containing either Setup data or an error
 */
export async function setup(url: string): Promise<Result<Setup, LockError>> {
	return await fetchLoop(url, (status, value) => {
		switch (status) {
			case "done":
				return [true, { digits: value.digits, deviceType: value.device_type }];
			default:
				return [false];
		}
	});
}

/**
 * Indicates the user accepted the authentication request.
 * The provided digits must be verified on the server and
 * result must be communicated to Login Complete endpoint
 * of the HENNGE Lock Server.
 */
export interface Accepted {
	result: "accepted";
	digits: string;
}

/**
 * Indicates the user rejected the authentication request.
 * The current authentication flow must not be allowed
 * to continue.
 */
export interface Rejected {
	result: "rejected";
}

/**
 * Union type for authentication results.
 */
export type Auth = Accepted | Rejected;

/**
 * Waits for the users response to a HENNGE Lock notification.
 * Polls until the user accepted or rejected the request, or
 * the request times out.
 *
 * @param url Returned from the login init endpoint of the HENNGE Lock Server
 * @returns A Result containing either Auth data or an error
 */
export async function auth(url: string): Promise<Result<Auth, LockError>> {
	return await fetchLoop<Auth>(url, (status, value) => {
		switch (status) {
			case "done":
				return [true, { result: "accepted", digits: value.digits }];
			case "rejected":
				return [true, { result: "rejected" }];
			default:
				return [false];
		}
	});
}

/**
 * Internal helper function that handles the polling loop logic.
 * Repeatedly calls the provided URL until a definitive result is obtained.
 *
 * @param url The endpoint to call
 * @param handler A function that processes response data and determines the next action
 * @returns A Result containing either the expected data or an error
 */
async function fetchLoop<T>(
	url: string,
	handler: (status: string, value: T) => Option<T>,
): Promise<Result<T, LockError>> {
	while (true) {
		const [ok, data] = await fetchWrapper(url);
		if (!ok) {
			return [false, data];
		}
		const status = data.status;
		if (status === "pending") {
			continue;
		}
		if (status === "timeout") {
			return [false, { type: "timeout" }];
		}
		const [isSome, value] = handler(status, data);
		if (!isSome) {
			return [false, { type: "unknown", error: data }];
		}
		return [true, value];
	}
}

/**
 * Internal helper function that wraps the fetch API call.
 * Handles HTTP requests and standardizes error responses.
 *
 * @param url The endpoint to call
 * @returns A Result containing either the response data or an error
 */
async function fetchWrapper<T>(url: string): Promise<Result<T, LockError>> {
	try {
		const response = await fetch(url);
		if (response.status !== 200) {
			return [false, { type: "http", response }];
		}
		const data = await response.json();
		return [true, data];
	} catch (error) {
		return [false, { type: "unknown", error }];
	}
}
