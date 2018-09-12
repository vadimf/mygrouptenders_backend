import { AppError } from "./app-error";

export class AppErrorWithData {
    constructor(public error: AppError, public data: any) {}
}
