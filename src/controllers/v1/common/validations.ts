import { Validation } from '../../../models/validation';

export class Validations {
    public password = new Validation(3, 24);
    public firstName = new Validation(2, 16);
    public lastName = new Validation(2, 16);
    public fullName = new Validation(4, 32);
    public confirmationCode = new Validation(4, 4);
    public childrenAmount = {
        min: 0,
        max: 9,
    };
    public pricing = {
        babysitting: {
            min: 2,
            max: 500,
        },
        cleaning: {
            min: 2,
            max: 500,
        },
        cooking: {
            min: 2,
            max: 500,
        },
    };
    public babysittingChildrenAmount = {
        min: 0,
        max: 9,
    };
    public hours = new Validation(
        5,
        5,
        /^(?:([01]?\d|2[0-3]):([0-5]?\d))$/,
    );
    public ratingComment = new Validation(
        4,
        255,
    );
}
