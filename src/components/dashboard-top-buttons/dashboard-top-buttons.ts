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
  Component, OnInit, Input, AfterViewInit, // @angular/core
  ElementRef, OnDestroy
} from 'angular-libs';

/**************************************************************************************************/

/**
 * Display buttons on big screens on the top right, used to be included remotly into the
 * dapp-wrapper top bar. Use the "on-small-move-down" class to move it automtically to the bottom
 * right corner of the screen. Within this component ion-searchbars will be hidden on small devices,
 * so you can easily create dynamic scaled top bar elements.
 *
 * @class      Component DashboardTopButtons
 */
@Component({
  selector: 'dashboard-top-buttons',
  templateUrl: 'dashboard-top-buttons.html'
})
export class DashboardTopButtons implements AfterViewInit, OnDestroy {
  /***************** initialization  *****************/
  constructor(
    private element: ElementRef,
  ) {  }

  /**
   * TODO: Optionally it can be move to body level to handle fixed containing elements
   */
  ngAfterViewInit() {
    // document.body.querySelector('ion-app').appendChild(this.element.nativeElement);
  }

  ngOnDestroy() {
    // document.body.querySelector('ion-app').removeChild(this.element.nativeElement);
  }
}
