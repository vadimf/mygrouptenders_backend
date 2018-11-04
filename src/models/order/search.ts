import { SearchEngine } from '../abstractions/search-engine';
import { IOrderDocument, IOrderModel, Order } from './order';

export interface IOrderSearchConditions {
  client?: any;
  status?: any;
  categories?: any;
  'address.area'?: any;
}

export class OrderSearch extends SearchEngine<IOrderDocument, IOrderModel> {
  protected model: IOrderModel = Order;

  constructor(
    currentPage: number,
    private conditions?: IOrderSearchConditions,
    private aggregationPipes?: any[]
  ) {
    super(currentPage);
  }

  protected getQueryConditions(): any {
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

  public async aggregateResults() {
    const results = (await this.model.aggregate(this.aggregationPipes)).map(
      (order: any) => new Order(order, false)
    );

    return await this.model.populateAll(results);

    // return await this.model.aggregate(this.aggregationPipes);
  }
}
