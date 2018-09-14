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
  Injectable,                        // '@angular/core';
  TranslateService,                  // @ngx-translate/core,
  AlertController, Alert, Platform   // ionic-angular
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanUtilService } from '../utils';

/**************************************************************************************************/

/**
 * Helper that imoproves input selection on mobile devices. It will scroll
 * automatically, so the input will appear within the viewport
 *
 * @class      Injectable EvanInputService
 */
@Injectable()
export class EvanInputService {
  /**
   * Elements to scroll to
   */
  private elementsToScrollTo = [ 'input', 'textarea', 'select'];

  /**
   * make it singletone and bind input focus events
   */
  constructor(
    private utils: EvanUtilService,
    private singleton: SingletonService,
    private platform: Platform
  ) {
    return singleton.create(EvanInputService, this, () => {
      /*if (this.utils.isMobileAndroid()) {
        if (this.utils.isNativeMobile()) {
          window.addEventListener('native.showkeyboard', async () => {
            await this.utils.timeout(200);

            this.scrollToActiveInput();
          });
        } else if (this.utils.isMobile()) {
          window.addEventListener('click', async () => {
            await this.utils.timeout(200);

            this.scrollToActiveInput();
          });
        }
      }*/
    });
  }

  /**
   * checks for an active dom element and scrolls the users viewport to this
   * input
   */
  scrollToActiveInput() {
    if (document.activeElement &&
        this.elementsToScrollTo.indexOf(document.activeElement.tagName.toLowerCase()) !== -1) {
      let scrollContent = this.utils.getParentByClassName(
        document.activeElement,
        'scroll-content'
      );

      if (scrollContent) {
        const activeElement = document.activeElement;

        this.utils.scrollTo(
          scrollContent,
          'vertical',
          this.utils.getOffsetTop(scrollContent, activeElement) - activeElement.clientHeight
        );
      }
    }
  }
}
