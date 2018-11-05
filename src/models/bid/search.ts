import { SearchEngine } from '../abstractions/search-engine';
import { Bid, IBidDocument, IBidModel, IBidSearchConditions } from './bid';

export class BidSearch extends SearchEngine<IBidDocument, IBidModel> {
  protected model: IBidModel = Bid;

  constructor(currentPage: number, private conditions?: IBidSearchConditions) {
    super(currentPage);
  }

  protected getQueryConditions() {
    return this.conditions;
  }

  public async getResults() {
    let query = this.model.get(this.getQueryConditions());

    if (!this.disablePagination) {
      const pagination = await this.getPagination();
      query = query.skip(pagination.offset).limit(pagination.resultsPerPage);
    }

    return await query;
  }

  public aggregateResults(): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
