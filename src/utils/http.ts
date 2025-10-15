/**
 * HTTP status codes for API responses.
 * 
 * @remarks
 * This object provides commonly used HTTP status codes to ensure consistency
 * across the application and improve code readability.
 * 
 * @example
 * ```typescript
 * res.status(HTTP_STATUS.OK).json({ message: 'Success' });
 * res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid input' });
 * ```
 */
export const HTTP_STATUS = {
    /** 200 - Request succeeded */
    OK: 200,
    /** 400 - Client sent invalid request */
    BAD_REQUEST: 400,
    /** 401 - Authentication required */
    UNAUTHORIZED: 401,
    /** 403 - Client lacks permission */
    FORBIDDEN: 403,
    /** 404 - Resource not found */
    NOT_FOUND: 404,
    /** 500 - Server encountered an error */
    INTERNAL_SERVER_ERROR: 500,
} as const;