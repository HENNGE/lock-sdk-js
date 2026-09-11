import type { output, ZodMiniType } from "zod/mini";
import {
	discriminatedUnion,
	literal,
	object as zobject,
	string as zstring,
} from "zod/mini";

/**
 * A Result type representing either a successful operation with data T,
 * or a failed operation with error E.
 */
export type Result<T, E> = [true, T] | [false, E];

/**
 * Error type for timeout conditions.
 */
export interface TimeoutError {
	type: "timeout";
}

/**
 * Error type when the request was aborted (e.g. via AbortController).
 */
export interface AbortError {
	type: "abort";
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
export type LockError = TimeoutError | AbortError | HttpError | UnknownError;

//#region Zod schemas for HENNGE Lock server response validation

// Common response schemas for polling status shared between setup and auth
const CommonResponseSchema = discriminatedUnion("status", [
	zobject({ status: literal("pending") }),
	zobject({ status: literal("timeout") }),
]);

// Successful response schema for setup
const SetupResponseSchema = zobject({
	status: literal("done"),
	digits: zstring(),
	device_type: zstring(),
});

// Successful response schema for authentication
const AuthResponseSchema = discriminatedUnion("status", [
	zobject({
		status: literal("done"),
		digits: zstring(),
	}),
	zobject({ status: literal("rejected") }),
]);

//#endregion

/**
 * Response from the users device to a setup request.
 * The digits must be verified on the server and the
 * Setup Complete endpoint of the HENNGE Lock Server
 * must be called with the verification result.
 * The device type is informational and may be stored
 * to provide a better user experience.
 */
export interface SetupResult {
	digits: string;
	deviceType: string;
}

/**
 * Initiates the setup process by making requests to the provided URL.
 * Continues polling until a valid response is received.
 *
 * @param url The endpoint to call for setup
 * @param options Optional. Pass `signal` from an AbortController to cancel the request.
 * @returns A Result containing either Setup data or an error
 */
export async function setup(
	url: string,
	options?: { signal?: AbortSignal },
): Promise<Result<SetupResult, LockError>> {
	return await fetchLoop(
		url,
		SetupResponseSchema,
		(response) => ({
			digits: response.digits,
			deviceType: response.device_type,
		}),
		options?.signal,
	);
}

/**
 * Indicates the user accepted the authentication request.
 * The provided digits must be verified on the server and
 * result must be communicated to Login Complete endpoint
 * of the HENNGE Lock Server.
 */
export interface AuthAccepted {
	result: "accepted";
	digits: string;
}

/**
 * Indicates the user rejected the authentication request.
 * The current authentication flow must not be allowed
 * to continue.
 */
export interface AuthRejected {
	result: "rejected";
}

/**
 * Union type for authentication results.
 */
export type AuthResult = AuthAccepted | AuthRejected;

/**
 * Authenticates with the provided URL.
 * Continues polling until authentication is either accepted or rejected.
 *
 * @param url The endpoint to call for authentication
 * @param options Optional. Pass `signal` from an AbortController to cancel the request.
 * @returns A Result containing either Auth data or an error
 */
export async function auth(
	url: string,
	options?: { signal?: AbortSignal },
): Promise<Result<AuthResult, LockError>> {
	return await fetchLoop(
		url,
		AuthResponseSchema,
		(response) => {
			switch (response.status) {
				case "done":
					return { result: "accepted", digits: response.digits };
				case "rejected":
					return { result: "rejected" };
			}
		},
		options?.signal,
	);
}

/**
 * Internal helper function that handles the polling loop logic.
 * Repeatedly calls the provided URL until a definitive result is obtained.
 *
 * @param url The endpoint to call
 * @param terminalSchema The zod schema of the expected response data (success state)
 * @param transform A function that processes response data and determines the next action
 * @param signal Optional AbortSignal to cancel the operation
 * @returns A Result containing either the expected data or an error
 */
async function fetchLoop<T, Schema extends ZodMiniType>(
	url: string,
	terminalSchema: Schema,
	transform: (value: output<Schema>) => T,
	signal?: AbortSignal,
): Promise<Result<T, LockError>> {
	while (true) {
		const [ok, rawResponse] = await fetchWrapper(url, signal);
		if (!ok) {
			return [false, rawResponse];
		}
		const commonResponse = CommonResponseSchema.safeParse(rawResponse);
		if (commonResponse.success) {
			switch (commonResponse.data.status) {
				case "pending":
					continue;
				case "timeout":
					return [false, { type: "timeout" }];
			}
		}
		const terminalResponse = terminalSchema.safeParse(rawResponse);
		if (terminalResponse.success) {
			return [true, transform(terminalResponse.data)];
		}
		return [false, { type: "unknown", error: terminalResponse.error }];
	}
}

/**
 * Internal helper function that wraps the fetch API call.
 * Handles HTTP requests and standardizes error responses.
 *
 * @param url The endpoint to call
 * @param signal Optional AbortSignal to cancel the request
 * @returns A Result containing either the response data or an error
 */
async function fetchWrapper(
	url: string,
	signal?: AbortSignal,
): Promise<Result<unknown, LockError>> {
	try {
		const response = await fetch(url, { signal });
		if (response.status !== 200) {
			return [false, { type: "http", response }];
		}
		const data = await response.json();
		return [true, data];
	} catch (error) {
		if (isAbortError(error)) {
			return [false, { type: "abort" }];
		}
		return [false, { type: "unknown", error }];
	}
}

function isAbortError(error: unknown): boolean {
	return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError"
    );
}
