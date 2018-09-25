import { Validation } from '../../../models/validation';

export class Validations {
    public fullName = new Validation(4, 32);
    public confirmationCode = new Validation(4, 4);
}
