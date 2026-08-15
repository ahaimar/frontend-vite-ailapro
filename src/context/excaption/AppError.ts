


export class AppError extends Error {
    public code: number | string;
    public data?: unknown;

    constructor(message: string, code: number | string = 500, data?: unknown) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.data = data;

        // Fix prototype chain for instanceof
        Object.setPrototypeOf(this, AppError.prototype);
    }
}