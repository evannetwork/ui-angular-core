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
  referenceApplicationRef,
  stopAngularApplication
} from '../../classes/ionicAppElement';

import {
  Component,
  ApplicationRef,
  ElementRef,
  AfterViewInit, OnInit, OnDestroy
} from 'angular-libs';

import {
  EvanRoutingService
} from '../../services/ui/routing';

import {
  buildModuleRoutes
} from '../../classes/routesBuilder';

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

  /***************** initialization  *****************/
  constructor(
    private applicationRef: ApplicationRef,
    private elementRef: ElementRef,
    private routingService: EvanRoutingService
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
  }

  /**
   * supply applicationRef to referenceApplicationRef
   */
  ngAfterViewInit() {
    this.ionAppElement = this.elementRef.nativeElement;

    while (!(this.ionAppElement.tagName.toLowerCase() === 'ion-app' || this.ionAppElement.tagName.toLowerCase() === 'body')) {
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

