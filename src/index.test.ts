import { setup, auth, type LockError } from "./index";

// Mock fetch
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

describe("setup", () => {
	beforeEach(() => {
		fetchMock.mockReset();
	});

	it("should return success when server returns done", async () => {
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				status: "done",
				digits: "123456",
				device_type: "TestDevice",
			}),
		});

		const result = await setup("http://example.invalid");

		expect(result).toEqual([
			true,
			{ digits: "123456", deviceType: "TestDevice" },
		]);
		expect(fetchMock).toHaveBeenCalledWith("http://example.invalid", {
			signal: undefined,
		});
	});

	it("should retry on pending status and eventually succeed", async () => {
		fetchMock
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({ status: "pending" }),
			})
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({ status: "pending" }),
			})
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({ status: "pending" }),
			})
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					status: "done",
					digits: "123456",
					device_type: "TestDevice",
				}),
			});

		const result = await setup("http://example.invalid");

		expect(result).toEqual([true, { digits: "123456", deviceType: "TestDevice" }]);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect(fetchMock).toHaveBeenCalledWith("http://example.invalid", {
			signal: undefined,
		});
	});

	it("should return timeout error when server returns timeout", async () => {
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ status: "timeout" }),
		});

		const result = await setup("http://example.invalid");

		expect(result).toEqual([false, { type: "timeout" }]);
	});

	it("should return http error when response status is not 200", async () => {
		const errorResponse = {
			status: 500,
			statusText: "Internal Server Error",
		};
		fetchMock.mockResolvedValueOnce(errorResponse);

		const result = await setup("http://example.invalid");

		// The implementation returns the raw response object in the error
		expect(result).toEqual([false, { type: "http", response: errorResponse }]);
	});

	it.each([
		{
			name: "fetch throws an error",
			error: new Error("Network error"),
			setupMock: (error: Error) => {
				fetchMock.mockRejectedValueOnce(error);
			},
		},
		{
			name: "json parsing fails",
			error: new Error("Invalid JSON"),
			setupMock: (error: Error) => {
				fetchMock.mockResolvedValueOnce({
					status: 200,
					json: async () => {
						throw error;
					},
				});
			},
		},
	])("should return unknown error when $name", async ({ setupMock, error }) => {
		fetchMock.mockReset();
		setupMock(error);

		const result = await setup("http://example.invalid");

		expect(result).toEqual([false, { type: "unknown", error }]);
	});

	it("should return abort error when the request is aborted", async () => {
		const controller = new AbortController();
		fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

		const result = await setup("http://example.invalid", {
			signal: controller.signal,
		});

		expect(result).toEqual([false, { type: "abort" }]);
		expect(fetchMock).toHaveBeenCalledWith("http://example.invalid", {
			signal: controller.signal,
		});
	});

	it.each([
		{
			name: "status field is invalid",
			response: {
				status: "invalid_status",
			},
		},
		{
			name: "digits field is missing",
			response: {
				status: "done",
				device_type: "Mobile",
			},
		},
		{
			name: "device_type field is missing",
			response: {
				status: "done",
				digits: "123456",
			},
		},
	])("should return unknown error when the zod schema is invalid: $name", async ({ response }) => {
		fetchMock.mockReset();
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => response,
		});

		const result = await setup("http://example.invalid");
		expectZodError(result);
	});
});

describe("auth", () => {
	beforeEach(() => {
		fetchMock.mockReset();
	});

	it("should return accepted when server returns done", async () => {
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				status: "done",
				digits: "123456",
			}),
		});

		const result = await auth("http://example.invalid");

		expect(result).toEqual([true, { result: "accepted", digits: "123456" }]);
		expect(fetchMock).toHaveBeenCalledWith("http://example.invalid", {
			signal: undefined,
		});
	});

	it("should return rejected when server returns rejected", async () => {
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({
				status: "rejected",
			}),
		});

		const result = await auth("http://example.invalid");

		expect(result).toEqual([true, { result: "rejected" }]);
	});

	it("should retry on pending status and eventually succeed", async () => {
		fetchMock
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({ status: "pending" }),
			})
			.mockResolvedValueOnce({
				status: 200,
				json: async () => ({
					status: "done",
					digits: "123456",
				}),
			});

		const result = await auth("http://example.invalid");

		expect(result).toEqual([true, { result: "accepted", digits: "123456" }]);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("should return timeout error when server returns timeout", async () => {
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => ({ status: "timeout" }),
		});

		const result = await auth("http://example.invalid");

		expect(result).toEqual([false, { type: "timeout" }]);
	});

	it("should return http error when response status is not 200", async () => {
		const errorResponse = {
			status: 500,
			statusText: "Internal Server Error",
		};
		fetchMock.mockResolvedValueOnce(errorResponse);

		const result = await auth("http://example.invalid");

		expect(result).toEqual([false, { type: "http", response: errorResponse }]);
	});

	it.each([
		{
			name: "fetch throws an error",
			error: new Error("Network error"),
			authMock: (error: Error) => {
				fetchMock.mockRejectedValueOnce(error);
			},
		},
		{
			name: "json parsing fails",
			error: new Error("Invalid JSON"),
			authMock: (error: Error) => {
				fetchMock.mockResolvedValueOnce({
					status: 200,
					json: async () => {
						throw error;
					},
				});
			},
		},
	])("should return unknown error when $name", async ({ authMock, error }) => {
		fetchMock.mockReset();
		authMock(error);

		const result = await auth("http://example.invalid");

		expect(result).toEqual([false, { type: "unknown", error }]);
	});

	it.each([
		{
			name: "status field is invalid",
			response: {
				status: "invalid_status",
			},
		},
		{
			name: "digits field is missing",
			response: {
				status: "done",
			},
		},
	])("should return unknown error when the zod schema is invalid: $name", async ({ response }) => {
		fetchMock.mockReset();
		fetchMock.mockResolvedValueOnce({
			status: 200,
			json: async () => response,
		});

		const result = await auth("http://example.invalid");
		expectZodError(result);
	});
});

function isLockError(error: unknown): error is LockError {
	return (
		typeof error === "object" &&
		error !== null &&
		"type" in error &&
		(error.type === "timeout" || error.type === "http" || error.type === "unknown")
	);
}

function expectZodError(result: [boolean, unknown]) {
	const [isSuccess, error] = result;
	expect(isSuccess).toBe(false);
	expect(isLockError(error)).toBe(true);
	if (isLockError(error) && error.type === "unknown") {
		const zodError = error.error;
		if (
			typeof zodError === "object" &&
			zodError !== null &&
			"name" in zodError
		) {
			expect(zodError.name).toBe("$ZodError");
		}
	}
}
