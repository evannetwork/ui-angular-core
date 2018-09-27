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

  You can be released from the requirements of the GNU Affero General Public
  License by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts
  of it on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address:
  https://evan.network/license/
*/

import {
  dapp
} from 'dapp-browser';

import {
  Component, OnInit,              // @angular/core
  Router, ActivatedRoute,         // @angular/router
  ElementRef, AfterViewInit,
  NgZone, OnDestroy,
  ChangeDetectorRef
} from 'angular-libs';

import { EvanBCCService } from '../../services/bcc/bcc';
import { EvanDescriptionService } from '../../services/bcc/description';
import { EvanRoutingService } from '../../services/ui/routing';
import { EvanUtilService } from '../../services/utils';
import { stopAngularApplication } from '../../classes/ionicAppElement';
import { AsyncComponent } from '../../classes/AsyncComponent';

/**************************************************************************************************/

// used for holding only next dapp timeout => look at ngAfterViewInit
let timeoutForNextDApp;

// check for recursive opened DApps and stop loading them!
let lastStartedDApp;
let multipleTimeout;
let multipleLoadCount = 0;

/**
 * Dynamic DApp loader component. Handles nested Angular DApps and loads the
 * latest ens address within the url.
 * 
 * Usage in angular html:
 *   <evan-dapp-loader></evan-dapp-loader>
 * 
 * Usage as wildcard route for dynamic DApp registering:
 * const routes: Routes = [
 *   ...,
 *   {
 *      path: '**',
 *      component: DAppLoaderComponent,
 *      data: {
 *        state: 'unkown',
 *        navigateBack: true
 *      }
 *    }
 *    ...
 *  ]
 * 
 *
 * @class      Component DAppLoaderComponent
 */
@Component({
  selector: 'evan-dapp-loader',
  templateUrl: 'dapp-loader.html'
})
export class DAppLoaderComponent extends AsyncComponent  {
  /*****************    variables    *****************/
  /**
   * dapp that should be started (detected from url)
   */
  private dappToStart: string;

  /**
   * Check if the current dapp was destroyed, to trigger dapp.nextDAppToLoad only once
   */
  private dappWasLoaded: boolean;

  /**
   * save the latest ionic app element to prevent duplicated app starting thats are not destroyed
   */
  private ionicAppElement: Element;

  /***************** initialization  *****************/
  constructor(
    private _ngZone: NgZone,
    private definitionService: EvanDescriptionService,
    private elementRef: ElementRef,
    private ref: ChangeDetectorRef,
    private routingService: EvanRoutingService,
    private utils: EvanUtilService,
  ) {
    super(ref);
  }

  /**
   * Apply the DApp that should be started from window.location. Waits for other
   * DApps that are within the opening process, wait for them and show the new
   * DApp.
   */
  async _ngAfterViewInit() {
    const windowHash = decodeURIComponent(window.location.hash);

    // parse current route by replacing all #/ and /# to handle incorrect navigations
    const currentHash = this.routingService.getRouteFromUrl(windowHash);

    // get module id
    const moduleIds = currentHash.split('/');
    for (let moduleId of moduleIds) {
      try {
        // only start the dapp if a dbcp exists!
        if (!document.getElementById(moduleId)) {
          const defintion = await this.definitionService.getDescription(moduleId);
          
          if (defintion.status !== 'invalid' && !document.getElementById(defintion.name)) {
            this.dappToStart = moduleId;

            break;
          }
        }
      } catch (ex) { }
    }

    // if no dapp to start is found with the url (e.g. when opening an contract
    // id), load the last url path
    if (!this.dappToStart && moduleIds.length > 0) {
      this.dappToStart = moduleIds[moduleIds.length - 1];
    }

    // check if another dapp is loading, wait for finishing, and start it next
    if (dapp.dappLoading) {
      dapp.nextDAppToLoad = () => {
        delete dapp.nextDAppToLoad;

        this.startDApp();
      };

      if (timeoutForNextDApp) {
        window.clearTimeout(timeoutForNextDApp);
      }

      // start the next DApp after 5 seconds when the DApp that is loaded
      // before, is not responding
      timeoutForNextDApp = setTimeout(() => dapp.nextDAppToLoad && dapp.nextDAppToLoad(), 5000);

      this.utils.log('dapp-loader, next-dapp to load overwritten by: ' + this.dappToStart, 'debug');
    } else {
      await this.startDApp();
    }
  }

  /**
   * stop the angular application that is laoded dynamically
   */
  async _ngOnDestroy() {
    stopAngularApplication();
    this.finishDAppLoading();
  }

  /*****************    functions    *****************/
  /**
   * Start the current detected angular application.
   */
  startDApp() {
    // if the opened dapp has changed, reset the multiple load count 
    if (lastStartedDApp !== this.dappToStart) {
      lastStartedDApp = this.dappToStart;
      multipleLoadCount = 0;

      if (multipleTimeout) {
        window.clearTimeout(multipleTimeout);
      }

      // reset the counter automatically after 3 seconds
      multipleTimeout = setTimeout(() => {
        lastStartedDApp = '';
      }, 2000);
    } else {
      // raise the multiple load count
      multipleLoadCount++;
    }

    // if 20 recursive dapps were opened within 3 seconds, stop loading!
    if (multipleLoadCount === 10) {
      this.utils.log(`Recursive DApp opening detected ${ this.dappToStart }`, 'error');
      return;
    }

    dapp.dappLoading = true;

    // to start a new angular application
    this._ngZone.runOutsideAngular(async () => {
      try {
        await dapp.startDApp(this.dappToStart, this.elementRef.nativeElement);

        this.elementRef.nativeElement.removeChild(
          this.elementRef.nativeElement.querySelectorAll('evan-loading')[0]
        );

      } catch (ex) {
        console.error(ex);
      }

      this.finishDAppLoading();
    })
  }

  /**
   * Finish the dapp loading within startDApp or when the dapp was cicked through space.
   */
  finishDAppLoading() {
    if (!this.dappWasLoaded) {
      this.dappWasLoaded = true;

      if (dapp.nextDAppToLoad) {
        dapp.nextDAppToLoad();
      } else {
        delete dapp.dappLoading;
      }
    }
  }
}
