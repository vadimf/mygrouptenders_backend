export class Pagination {
    constructor(private _page: number = 1, private _results: number = 0, private _resultsPerPage: number = 25) {}

    get disabled(): boolean {
        return this._page < 0;
    }

    get page(): number {
        if ( ! this._page ) {
            return 1;
        }

        return this._page;
    }

    get results(): number {
        return this._results;
    }

    get resultsPerPage(): number {
        return this._resultsPerPage;
    }

    get pages(): number {
        if ( ! this.results || ! this.resultsPerPage ) {
            return 0;
        }

        return Math.ceil(this.results / this.resultsPerPage );
    }

    get resultsCurrentPage(): number {
        if ( ! this.results || this.page > this.pages ) {
            return 0;
        }

        if ( this.page === this.pages ) {
            return this.results - (this.resultsPerPage * (this.pages - 1));
        }

        return this.resultsPerPage;
    }

    get offset(): number {
        const currentPage = this.page > 0 ? this.page - 1 : 0;
        return this.resultsPerPage * currentPage;
    }

    public paginateManually(items: any[]): any[] {
        if ( this.disabled ) {
            return items;
        }

        const returnItems: any[] = [];
        this._results = items.length;

        for ( let i = this.offset; i <= this.offset + this.resultsPerPage - 1 && i < this.results; i++ ) {
            if ( items[i] ) {
                returnItems.push(items[i]);
            }
        }

        return returnItems;
    }

    public toJSON() {
        if ( this.disabled ) {
            return undefined;
        }

        return {
            page: this.page,
            pages: this.pages,
            results: this.results,
            resultsPerPage: this.resultsPerPage,
            resultsCurrentPage: this.resultsCurrentPage,
            offset: this.offset,
        };
    }
}
