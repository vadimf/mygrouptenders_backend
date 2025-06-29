import { NumberValidation, Validation } from '../../../models/validation';

export class Validations {
  public fullName = new Validation(4, 32);
  public confirmationCode = new Validation(4, 4);
  public orderDescription = new Validation(0, 200);
  public providerProfileOverview = new Validation(0, 500);
  public providerReview = new Validation(0, 500);
  public bidComment = new Validation(0, 200);
  public reviewRating = new NumberValidation(0, 5);
}
