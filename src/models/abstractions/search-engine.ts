import { Document, DocumentQuery, Model } from 'mongoose';

import { Pagination } from '../pagination';

export abstract class SearchEngine<D extends Document, T extends Model<D>> {
  private pagination?: Pagination;

  protected abstract model: T;

  public disablePagination: boolean;

  constructor(
    protected currentPage: number,
    protected resultsPerPage?: number
  ) {
    this.disablePagination = currentPage < 0;
  }

  /**
   * Prepare search query conditions
   *
   * @returns {Promise<any> | any}
   * @private
   */
  protected abstract getQueryConditions(): Promise<any> | any;

  /**
   * Count total results for search
   *
   * @returns {Promise<number>}
   */
  public async countResults(): Promise<number> {
    return this.model.count(await this.getQueryConditions());
  }

  /**
   *
   * @returns {Promise<DocumentQuery<D, D> | DocumentQuery<D[], D>>}
   */
  public abstract getResults(): Promise<D[]>;

  /**
   * Get pagination object (if pagination enabled)
   *
   * @returns {Promise<Pagination | null>}
   */
  public async getPagination(): Promise<Pagination | null> {
    if (this.disablePagination) {
      return null;
    }

    if (!this.pagination) {
      this.pagination = new Pagination(
        this.currentPage,
        await this.countResults(),
        this.resultsPerPage
      );
    }

    return this.pagination;
  }
}
