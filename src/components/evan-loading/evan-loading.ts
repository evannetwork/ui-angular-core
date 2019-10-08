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
  Component, OnInit, Input, OnDestroy, // @angular/core
  Observable, ChangeDetectorRef, DomSanitizer
} from 'angular-libs';

import {
  EvanRoutingService
} from '../../services/ui/routing'

/**************************************************************************************************/

/**
 * Evan network loading img wrapper.
 *
 * @class      Component EvanLoadingComponent
 */
@Component({
  selector: 'evan-loading',
  templateUrl: 'evan-loading.html'
})
export class EvanLoadingComponent implements OnInit, OnDestroy {
  /***************** inputs & outpus *****************/
  /**
   * milliseconds to delay the loading symbol display (normally the DApp will
   * load within 500ms and their we need no loading icon)
   */
  @Input() delayLoading: number;

  /**
   * text that should be displayed during loading
   */
  @Input() loadingText: number;

  /*****************    variables    *****************/
  /**
   * show / hide the component
   */
  private show: boolean;

  /**
   * handle dapp crashes, so the dapp can navigate back, when dapp is not loading
   */
  private showBackButtons: boolean;

  /**
   * save setTimeout reference to clear it after component destroyed 
   */
  private waitForBackButton: any;

  /**
   * check if we are on dashboard, hide loaded to long go to dashboard button
   */
  private isDashboardDApp: boolean;

  /**
   * Shows a custom loading symbol from localStorage
   */
  private customLoading: string;

  /***************** initialization  *****************/
  constructor(
    private routing: EvanRoutingService,
    private ref: ChangeDetectorRef,
    private _DomSanitizer: DomSanitizer,
  ) { }

  /**
   * show the loading symbol directly or after delayLoading ms
   */
  ngOnInit() {
    this.ref.detach();

    // check if a custom loading symbol was specified
    if (window.localStorage['evan-custom-loading']) {
      this.customLoading = window.localStorage['evan-custom-loading'];
    }

    if (this.delayLoading) {
      setTimeout(() => {
        this.show = true;

        this.ref.detectChanges();
      }, this.delayLoading);
    } else {
      this.show = true;
    }

    if (this.routing.getActiveRootEns().indexOf('onboarding') === -1) {
      this.waitForBackButton = setTimeout(() => {
        this.showBackButtons = true;

        this.ref.detectChanges();
      }, 15 * 1000);

      this.isDashboardDApp = this.routing.getActiveRootEns().indexOf('dashboard') !== -1;
    }

    this.ref.detectChanges();
  }

  ngOnDestroy() {
    window.clearTimeout(this.waitForBackButton);
  }
}
