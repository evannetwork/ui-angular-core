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

import * as CoreBundle from 'bcc';

import { AsyncComponent } from '../../classes/AsyncComponent';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanBCCService } from '../../services/bcc/bcc';

/**************************************************************************************************/

/**
 * Contract paged listentry display. Each DataContract
 * (https://github.com/evannetwork/api-blockchain-core/blob/develop/docs/contracts/data-contract.rst))))
 * can have several list definitions to store its necessary data in. Each of this lists can grow to
 * an large list of elements. To be able to page this entries easily this component can be used.
 *
 * @class      Component ListPagingComponent
 */
@Component({
  selector: 'contract-listentries',
  templateUrl: 'contract-listentries.html',
  animations: [ ]
})
export class ContractListEntriesComponent extends AsyncComponent {
  /***************** inputs & outpus *****************/
  /**
   * contract to load the  data for
   */
  @Input() contractId: string;

  /**
   * list name to load the data for
   */
  @Input() listName: string;

  /**
   * page size to split the loaded bunches in
   */
  @Input() count: number;

  /**
   * should the data loaded reverse?
   */
  @Input() reverse: boolean;

  /**
   * store values in dfs
   */
  @Input() dfsStorage = true;

  /**
   * encrypt hashes from values
   */
  @Input() encryptedHashes = true;

  /**
   * is emitted when new data was loaded
   */
  @Input() onUpdate: Function;

  /**
   * Is emitted when an error occured
   *
   * @class      Input (name)
   * @return     {<type>}  { description_of_the_return_value }
   */
  @Input() onError: Function;

  /*****************    variables    *****************/
  /**
   * loaded list entries
   */
  public listEntries: Array<any>;

  /**
   * total list entry count
   */
  private listEntryCount: number;

  /**
   * count of current loaded list entries
   */
  private offset: number;

  /**
   * list paging component reference
   */
  private listPaging: any;

  /**
   * data contract instance for the current contract id
   */
  private dataContract: any;
  
  /***************** initialization  *****************/
  /**
   * load dependencies
   */
  constructor(
    private bcc: EvanBCCService,
    private core: EvanCoreService,
    private ref: ChangeDetectorRef,
  ) {
    super(ref);
  }

  /**
   * load total listEntryCount and initial todos
   */
  async _ngOnInit() {
    this.listEntries = [ ];
    this.offset = 0;
    this.listEntryCount = 0;
    this.reverse = !!this.reverse;

    this.dataContract = new CoreBundle.DataContract({
      cryptoProvider: this.bcc.description.cryptoProvider,
      dfs: CoreBundle.CoreRuntime.dfs,
      executor: CoreBundle.CoreRuntime.executor,
      loader: CoreBundle.CoreRuntime.contractLoader,
      nameResolver: this.bcc.nameResolver,
      sharing: CoreBundle.ProfileRuntime.sharing,
      web3: CoreBundle.CoreRuntime.web3,
      description: CoreBundle.CoreRuntime.description,
    });

    this.listEntryCount = await this.dataContract
      .getListEntryCount(this.contractId, this.listName);

    await this.loadMore();
  }

  /**
   * Refresh the current loaded data.
   */
  async refresh() {
    this.loading = true;
    this.ref.detectChanges();

    this.listEntries = [ ];
    this.listEntryCount = await this.dataContract
      .getListEntryCount(this.contractId, this.listName);
    await this.loadMore(0, this.listEntries.length);

    this.loading = false;
    this.ref.detectChanges();
  }

  /*****************    functions    *****************/
  /**
   * Load new todos for the specific contract and listName.
   */
  async loadMore(offset = this.listEntries.length, count = this.count) {
    try {
      // load new data
      const newListEntries = await this.dataContract.getListEntries(
        this.contractId,
        this.listName,
        this.core.activeAccount(),
        this.dfsStorage,
        this.encryptedHashes,
        this.count,
        this.listEntries.length,
        this.reverse
      );

      // add them to the current list and run the update function
      this.listEntries = this.listEntries.concat(newListEntries);
      await this.onUpdate(this.listEntries);

      this.ref.detectChanges();
      if (this.listPaging) {
        this.listPaging.ref.detectChanges();
      }
    } catch (ex) {
      if (typeof this.onError === 'function') {
        this.onError(ex);
      } else {
        this.core.utils.log(this.core.utils.getErrorLog(ex), 'error');
      }
    }
  }
}