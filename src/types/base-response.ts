export interface BaseResponse<T> {
    statusCode: number;
    details: T;
    result: string;
}