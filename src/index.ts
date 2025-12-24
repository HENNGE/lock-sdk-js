import {
	discriminatedUnion,
	literal,
	object as zobject,
	string as zstring,
} from "zod/mini";
import type { ZodMiniType, output } from "zod/mini";

/**
 * A Result type representing either a successful operation with data T,
 * or a failed operation with error E.
 */
export type Result<T, E> = [true, T] | [false, E];

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

const Pending = zobject({
	status: literal("pending"),
});
const Timeout = zobject({
	status: literal("timeout"),
});
const CommonResponses = discriminatedUnion("status", [Pending, Timeout]);

const SetupDone = zobject({
	status: literal("done"),
	digits: zstring(),
	device_type: zstring(),
});

/**
 * Initiates the setup process by making requests to the provided URL.
 * Continues polling until a valid response is received or the operation
 * times out.
 *
 * @param url Returned from the Setup Init endpoint of the HENNGE Lock Server
 * @returns A Result containing either Setup data or an error
 */
export async function setup(url: string): Promise<Result<Setup, LockError>> {
	return await fetchLoop(url, SetupDone, (done) => {
		return { digits: done.digits, deviceType: done.device_type };
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

const AcceptedResponse = zobject({
	status: literal("done"),
	digits: zstring(),
});
const RejectedResponse = zobject({
	status: literal("rejected"),
});
const AuthResponse = discriminatedUnion("status", [
	AcceptedResponse,
	RejectedResponse,
]);

/**
 * Waits for the users response to a HENNGE Lock notification.
 * Polls until the user accepted or rejected the request, or
 * the request times out.
 *
 * @param url Returned from the login init endpoint of the HENNGE Lock Server
 * @returns A Result containing either Auth data or an error
 */
export async function auth(url: string): Promise<Result<Auth, LockError>> {
	return await fetchLoop(url, AuthResponse, (resp) => {
		switch (resp.status) {
			case "done":
				return { result: "accepted", digits: resp.digits };
			case "rejected":
				return { result: "rejected" };
		}
	});
}

/**
 * Internal helper function that handles the polling loop logic.
 * Repeatedly calls the provided URL until a definitive result is obtained.
 *
 * @param url The endpoint to call
 * @param schema The zod schema of the expected response data
 * @param handler A function that processes response data and determines the next action
 * @returns A Result containing either the expected data or an error
 */
async function fetchLoop<T, Schema extends ZodMiniType>(
	url: string,
	schema: Schema,
	handler: (value: output<Schema>) => T,
): Promise<Result<T, LockError>> {
	while (true) {
		const [ok, data] = await fetchWrapper(url);
		if (!ok) {
			return [false, data];
		}
		const commonResult = CommonResponses.safeParse(data);
		if (commonResult.success) {
			switch (commonResult.data.status) {
				case "pending":
					continue;
				case "timeout":
					return [false, { type: "timeout" }];
			}
		}
		const specificResult = schema.safeParse(data);
		if (specificResult.success) {
			return [true, handler(specificResult.data)];
		}
		return [false, { type: "unknown", error: specificResult.error }];
	}
}

/**
 * Internal helper function that wraps the fetch API call.
 * Handles HTTP requests and standardizes error responses.
 *
 * @param url The endpoint to call
 * @returns A Result containing either the response data or an error
 */
async function fetchWrapper(url: string): Promise<Result<unknown, LockError>> {
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
