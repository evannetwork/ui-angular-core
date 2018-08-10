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
  Injectable,               // '@angular/core';
  Platform                  // ionic-angular
} from 'angular-libs';

import { EvanUtilService } from './utils';

/**************************************************************************************************/

/**
 * Singleton service to be able to create single service instances.
 *
 * @class      Injectable (name)
 * @return     {<type>}  { description_of_the_return_value }
 */
@Injectable()
export class SingletonService {
  constructor() {
    return this.create(SingletonService, this);
  }

  /**
   * Creates an single references for services to handle one time service creations and value bindings.
   *
   * @param SingeltonServiceClass   Class object
   * @param instance                Current instance of an class.
   * @param init                    Function to run, if the service was created once
   * @param updateOnCoreChange      Run init function, if evan core gets updated
   */
  create(SingeltonServiceClass: any, instance: any, init?: Function, updateOnCoreChange?: boolean) {
    if (SingeltonServiceClass.instance) {
      SingeltonServiceClass.instance = SingeltonServiceClass.instance;
    } else {
      SingeltonServiceClass.instance = instance;

      if (init) {
        init();

        // if updateOnCoreChange is available, run the init function with an reload = true parameter
        // triggered when :
        //   - identity import is finished
        //   - onboarding is finished
        if (updateOnCoreChange) {
          window.addEventListener('evan-core-setup', () => {
            init(true);
          }, false);
        }
      }
    }

    return SingeltonServiceClass.instance;
  }
}
