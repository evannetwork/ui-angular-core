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
  Router, ActivatedRoute,   // '@angular/router';
  ErrorHandler, Injectable, // '@angular/core';
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

/**************************************************************************************************/

/**
 * Global angular exception handler.
 *
 * @class      Injectable EvanExceptionHandler
 */
@Injectable()
export class EvanExceptionHandler implements ErrorHandler {
  /**
   * predefined error cases
   */
  errorCases: Array<any>;

  /**
   * create singleton instance and set initial values
   */
  constructor(
    private singleton: SingletonService,
  ) {
    this.errorCases = [
      {
        messageKey: 'invalid views to insert',
        run: (error: Error): void => {
          console.warn('invalid views to insert');
        }
      }
    ];
  }

  /**
   * Handles an Exception, logs it to the console and redirects to the evan error page
   *
   * @param      {Error}   error   Incoming exception that should be parsed
   */
  handleError(error: Error): void {
    if (error && error.message) {
      for (let i = 0; i < this.errorCases.length; i++) {
        if (error.message.indexOf(this.errorCases[i].messageKey) !== -1) {
          return this.errorCases[i].run();
        }
      }
    }

    console.log('exception handler log')
    console.error(error);
  }
}
