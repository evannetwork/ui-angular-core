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
  Component, OnInit, Input,  // @angular/core
  Observable
} from 'angular-libs';

import {
  EvanRoutingService
} from '../../services/ui/routing'

/**************************************************************************************************/

/**
 * Is used to hardly reload an route. The user gets navigate to this route and
 * it will navigate back after 500 milliseconds
 * 
 * Usage within routesBuilder dashboardRoutes:
 *  ...
 *  {
 *    path: `evan-reload`,
 *    component: EvanReloadComponent,
 *    data: {
 *      navigateBack : true
 *    }
 *  },
 *  ...
 *
 * @class      Component EvanReloadComponent
 */
@Component({
  selector: 'evan-reload-route',
  templateUrl: 'reload-route.html'
})

export class EvanReloadComponent implements OnInit {
  /***************** initialization  *****************/
  constructor(
    private routing: EvanRoutingService
  ) { }

  /**
   * navigate back
   */
  ngOnInit() {
    setTimeout(() => {
      this.routing.goBack();
    }, 500);
  }
}
