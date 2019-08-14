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
  utils
} from 'dapp-browser';

import {
  referenceApplicationRef,
  stopAngularApplication
} from '../../classes/ionicAppElement';

import {
  Component,
  ApplicationRef,
  ElementRef,
  AfterViewInit, OnInit, OnDestroy
} from 'angular-libs';

import { buildModuleRoutes } from '../../classes/routesBuilder';
import { EvanCoreService } from '../../services/bcc/core';
import { EvanRoutingService } from '../../services/ui/routing';

/**************************************************************************************************/

/**
 * Generic evan.network Angular 5 featured DApp bootstrap component.
 *   - helpers for dynamic routing configurations for dynamic parent routes
 *   - registers referenceApplicationRef for correct deleting later
 * 
 * Usage (in every featured dapp module):
 *   imports.push(IonicModule.forRoot(BootstrapComponent, {
 *     mode: 'md'
 *   }));
 *
 * @class      Component BootstrapComponent
 */
@Component({
  selector: 'bootstrap-component',
  templateUrl: 'bootstrap-component.html',
})
export class BootstrapComponent implements OnInit, AfterViewInit, OnDestroy {
  /**
   * check if the component was destroyed before ngAfterViewInit to remove the element within
   * ngAfterViewInit
   */
  private isDestroyed: boolean;

  /**
   * ionic app parent element
   */
  private ionAppElement: Element;

  /**
   * Is the current browser allowed?
   */
  private supportedBrowser: boolean;

  /***************** initialization  *****************/
  constructor(
    private applicationRef: ApplicationRef,
    private core: EvanCoreService,
    private elementRef: ElementRef,
    private routingService: EvanRoutingService,
  ) {  }

  /**
   * checks dynamic routing definitions and resets the actual configuration to
   * take the correct ones
   */
  ngOnInit() {
    let routeConfig = this.routingService.router.config;

    // adjust ontime routes for dynamic inclusion to multiple parent routes
    if (routeConfig && routeConfig.length > 0 && routeConfig[0].data &&
      routeConfig[0].data.evanDynamicRoutes) {
      const dynamicRoutesConfig = routeConfig[0].data.dynamicRoutesConfig;

      routeConfig = buildModuleRoutes(
        dynamicRoutesConfig.dappEns,
        dynamicRoutesConfig.CoreComponent,
        dynamicRoutesConfig.routes
      );

      this.routingService.router.resetConfig(routeConfig);
    }

    // check if the current browser is allowed
    if (utils.browserName === 'Firefox' && utils.isPrivateMode) {
      this.supportedBrowser = false;
    } else {
      this.supportedBrowser = [
        'Opera',  'Firefox', 'Safari', 'Chrome', 'Edge', 'Blink',
      ].indexOf(utils.browserName) !== -1;
    }

    // hide loading and stop anything, when browser is not supported
    if (!this.supportedBrowser) {
      this.core.finishDAppLoading();
    }
  }

  /**
   * supply applicationRef to referenceApplicationRef
   */
  ngAfterViewInit() {
    this.ionAppElement = this.elementRef.nativeElement;

    while (this.ionAppElement && this.ionAppElement.className &&
           this.ionAppElement.className.indexOf('evan-angular') === -1 &&
           this.ionAppElement.tagName.toLowerCase() !== 'body') {
      this.ionAppElement = this.ionAppElement.parentElement;
    }

    referenceApplicationRef(this.applicationRef, this.ionAppElement);

    if (this.isDestroyed) {
      this.removeNativeElement();
    }
  }

  ngOnDestroy() {
    this.isDestroyed = true;
    this.removeNativeElement();
  }

  /**
   * Remove the ionAppElment from parent
   */
  removeNativeElement() {
    if (this.ionAppElement && this.ionAppElement.parentElement) {
      this.ionAppElement.parentElement.removeChild(this.ionAppElement);
      stopAngularApplication();
    }
  }
}

