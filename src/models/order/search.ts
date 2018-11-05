import { SearchEngine } from '../abstractions/search-engine';
import {
  IOrderDocument,
  IOrderModel,
  IOrderSearchConditions,
  Order
} from './order';

export class OrderSearch extends SearchEngine<IOrderDocument, IOrderModel> {
  protected model: IOrderModel = Order;

  constructor(
    currentPage: number,
    private conditions?: IOrderSearchConditions,
    private aggregationPipes?: any[]
  ) {
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

  public async aggregateResults() {
    let pipelines = [
      {
        $match: this.getQueryConditions()
      },
      ...this.aggregationPipes
    ];
    if (!this.disablePagination) {
      const pagination = await this.getPagination();

      pipelines = [
        ...pipelines,
        {
          $skip: pagination.offset
        },
        {
          $limit: pagination.resultsPerPage
        }
      ];
    }

    const results = (await this.model.aggregate(pipelines)).map(
      (order: any) => new Order(order, false)
    );

    return await this.model.populateAll(results);
  }
}
