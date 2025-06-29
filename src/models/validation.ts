// tslint:disable:max-classes-per-file

export class Validation {
  constructor(
    public minLength?: number,
    public maxLength?: number,
    public regex?: RegExp
  ) {}

  public toJSON() {
    return {
      minLength: this.minLength || undefined,
      maxLength: this.maxLength || undefined,
      regex: this.regex ? this.regex.toString() : undefined
    };
  }

  public isValid(input: string) {
    return (
      !(this.minLength && input.length < this.minLength) &&
      !(this.maxLength && input.length > this.maxLength) &&
      !(this.regex && !this.regex.test(input))
    );
  }
}

export class NumberValidation {
  constructor(public min?: number, public max?: number) {}

  public isValid(input: number) {
    return input >= this.min && input <= this.max;
  }
}
