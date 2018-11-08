import { SearchEngine } from '../abstractions/search-engine';
import { IReviewDocument, IReviewModel, Review } from './review';

export class ReviewSearch extends SearchEngine<IReviewDocument, IReviewModel> {
  protected model: IReviewModel = Review;

  constructor(currentPage: number, private conditions?: any) {
    super(currentPage);
  }

  protected getQueryConditions() {
    return this.conditions;
  }

  public getResults(): Promise<IReviewDocument[]> {
    throw new Error('Method not implemented.');
  }

  public async aggregateResults(pathToList: string) {
    throw new Error('Method not implemented.');
  }
}
