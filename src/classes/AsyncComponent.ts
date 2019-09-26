/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see http://www.gnu.org/licenses/ or
  write to the Free Software Foundation, Inc., 51 Franklin Street,
  Fifth Floor, Boston, MA, 02110-1301 USA, or download the license from
  the following URL: https://evan.network/license/
*/

import {
  Component, OnInit, OnDestroy, // @angular/core
  TranslateService,             // @ngx-translate/core
  NavController,                // ionic-angular
  ChangeDetectorRef
} from 'angular-libs';

import {
  EvanCoreService
} from '../services/bcc/core';

import {
  utils
} from 'dapp-browser';

/**************************************************************************************************/

/**
 * Use for Components that implements asynchronious ngOnInit functions. The ngOnInit function will
 * be called and processed. If the App is switched very fast, the ngOnDestroy is called before the
 * ngOnInit was resolved. As a result of this, watcher can be bound after ngOnDestroy and will never
 * be detached again. Also, this.ref.detectChanges(); functions are called after the ngOnInit was
 * resolved. If the view is already detached, this will trigger more errors. Extend your component
 * with this class and change your ngOnInit and ngOnDestroy functions into _ngOnInit and
 * _ngOnDestroy. The ref is automatically detached, and the loading attribute is set, until the
 * ngOnInit was resolved. At the end, if the view wasnt destroyed before, the loading will be
 * removed and the functions will be called "this.ref.detectChanges();"
 *
 * Usage:
 * 
 *   export class DAppsRootComponent extends AsyncComponent {
 *     private watchRouteChange: Function;
 *
 *     constructor(
 *       private core: EvanCoreService,
 *       private bcc: EvanBCCService,
 *       private ref: ChangeDetectorRef,
 *       private routingService: EvanRoutingService
 *     ) {
 *       super(ref);
 *     }
 *
 *     async _ngOnInit() {
 *       this.watchRouteChange = this.routingService.subscribeRouteChange(() => this.ref.detectChanges());
 *       await this.bcc.initialize((accountId) => this.bcc.globalPasswordDialog(accountId));
 *       await this.core.utils.timeout(1000);
 *     }
 *
 *     _ngOnDestroy() {
 *       this.watchRouteChange();
 *     }
 *   }
 */
export class AsyncComponent implements OnInit, OnDestroy {
  /**
   * the Angular ChangeDetectorRef to detach the automatic change detection and optimize performance
   */
  private _ref: ChangeDetectorRef;
  
  /**
   * disable initial detectChanges
   */
  public detachRef: boolean;
  
  /**
   * promise that waits to wait for ngOnInit to be resolved
   */
  public awaitOnInit: Promise<any>;

  /**
   * used to show a loading symbol in components
   */
  public loading: boolean;

  /**
   * set, when the ngOnDestroy function was called
   */
  public wasDestroyed: boolean;


  /**
   * Take service from component super call.
   */
  constructor(ref: ChangeDetectorRef, detachRef = true) {
    this._ref = ref;
    this.detachRef = detachRef;
  }

  /**
   * Detach the ref, awaits the _ngOnInit and remove loading if the dapp wasnt destroyed before
   *
   * @return     {Promise<void>}  resolved when done
   */
  async ngOnInit() {
    if (this.detachRef) {
      this._ref.detach();
      this.loading = true;
      this._ref.detectChanges();
    }

    this.awaitOnInit = this._ngOnInit();

    // if it is an promise, add a catch function
    if (this.awaitOnInit && this.awaitOnInit.then) {
      this.awaitOnInit.catch(
        ex => utils.log(`Error while initializing component: ${ ex.message }`, 'error')
      );
    }

    await this.awaitOnInit;

    if (!this.wasDestroyed) {
      this.loading = false;
      this._ref.detectChanges();
    }
  }

  /**
   * Is called by the ngOnInit function. Should be overwritten by the inherting component.
   *
   * @return     {Promise<void>}  resolved when done
   */
  async _ngOnInit() {  }

  /**
   * Runs the _ngOnViewInit function if the dapp wasnt destroyed before
   *
   * @return     {Promise<void>}  resolved when done
   */
  async ngAfterViewInit() {
    await this.awaitOnInit;
    if (!this.wasDestroyed) {
      this._ngAfterViewInit();
    }
  }

  /**
   * Is called by the ngAfterViewInit function. Should be overwritten by the inherting component.
   *
   * @return     {Promise<void>}  resolved when done
   */
  async _ngAfterViewInit() { }

  /**
   * Set the wasDestroyed variable and await the "awaitOnInit" Promise to run the ngOnDestroy
   * function.
   *
   * @return     {Promise<void>}  resolved when done
   */
  async ngOnDestroy() {
    this.wasDestroyed = true;

    await this.awaitOnInit;

    this._ngOnDestroy();
  }

  /**
   * Is called by the ngOnDestroy function. Should be overwritten by the inherting component.
   *
   * @return     {Promise<void>}  resolved when done
   */
  async _ngOnDestroy() { }
}