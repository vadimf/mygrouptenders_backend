import { ObjectId } from 'mongodb';
import { DocumentQuery } from 'mongoose';

import { SearchEngine } from '../abstractions/search-engine';
import { IOrderDocument, IOrderModel, Order } from './order';

export interface IOrderSearchConditions {
  client: ObjectId;
  status: any;
}

export class OrderSearch extends SearchEngine<IOrderDocument, IOrderModel> {
  protected model: IOrderModel = Order;

  constructor(currentPage: number, private conditions: IOrderSearchConditions) {
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
}
