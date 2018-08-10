/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License along with this program.
  If not, see http://www.gnu.org/licenses/ or write to the

  Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA, 02110-1301 USA,

  or download the license from the following URL: https://evan.network/license/

  You can be released from the requirements of the GNU Affero General Public License
  by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts of it
  on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address: https://evan.network/license/
*/

import {
  Component, OnInit,     // @angular/core
  Input, ViewChild, ElementRef, OnDestroy,
  Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef,
  MenuController, AfterViewInit
} from 'angular-libs';

import { EvanCoreService } from '../../services/bcc/core';
import { EvanAddressBookService } from '../../services/bcc/address-book';

/**************************************************************************************************/

/**
 * Contract paged listentry display
 * 
 * Usage:
 *   <list-paging *ngIf="!loading" #listPaging
 *     [offset]="listEntries.length"
 *     [totalSize]="listEntryCount"
 *     [loadMore]="loadMore.bind(this)">
 *   </list-paging>
 *
 * @class      Component ListPagingComponent
 */
@Component({
  selector: 'list-paging',
  templateUrl: 'list-paging.html',
  animations: [ ]
})
export class ListPagingComponent implements OnInit {
  /***************** inputs & outpus *****************/
  /**
   * offset to load the data from (start at index 0, 10, 33, ...)
   */
  @Input() offset: number;

  /**
   * page size to split the loaded bunches in
   */
  @Input() totalSize: number;

  /**
   * function that is called to load more data
   */
  @Input() loadMore: Function;

  /*****************    variables    *****************/
  /**
   * loading indicator
   */
  private loading: boolean;
  
  /***************** initialization  *****************/
  constructor(
    private ref: ChangeDetectorRef,
  ) {}

  /**
   * ref.detach and ref.detectChanges
   */
  ngOnInit() {
    this.ref.detach();
    this.ref.detectChanges();
  }

  /*****************    functions    *****************/
  private async runLoadMore() {
    this.loading = true;
    this.ref.detectChanges();

    await this.loadMore(this.offset, this.totalSize);

    this.loading = false;
    this.ref.detectChanges();
  }
}