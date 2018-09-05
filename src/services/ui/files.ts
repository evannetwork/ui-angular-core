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
  Injectable,               // '@angular/core';
  OnDestroy
} from 'angular-libs';

import { EvanUtilService } from '../utils';
import { EvanBCCService } from '../bcc/bcc';

/**************************************************************************************************/

/**
 * Service to handle files and its encryption / decryption.
 *
 * @class      Injectable EvanFileService
 */
@Injectable()
export class EvanFileService implements OnDestroy {
  constructor(
    private utils: EvanUtilService,
    private bcc: EvanBCCService
  ) { }

  /**
   * Uploads an array of fils that were selected with an HTML 5 <input type="file"> selector or using
   * the evan-file-select component and transforms them into an encryption object
   *
   * @param      {Array<any>}    files    array of files
   * @return     {Promise<any>}  uploaded files transformed into an encryption object 
   */
  public async uploadFilesAndSetEncryption(files: Array<any>) {
    files = await Promise.all(
      files.map((file) => new Promise((resolve, reject) => {
        if(file.file) {
          return resolve(file);
        }                
        const fileReader = new FileReader();

        // when the file was loaded successfully, return the uploaded file object
        fileReader.onloadend = function (e) {
          const ret = {
            file: (<any>e.target).result
          };

          // write keys into the file object for creating a copy with correct syntax
          for (let fileProp in file) {
            ret[fileProp] = file[fileProp];
          };

          // resolve the file
          resolve(ret);
        };

        // start file reading
        fileReader.readAsArrayBuffer(file);
      }))
    );

    // overwrite the attachments object with the crypto informations, how the data needs to
    // be decrypted
    return {
      'private': files,
      cryptoInfo: {
        algorithm: 'aes-blob',
        originator: this.bcc.nameResolver.soliditySha3('*')
      }
    };
  }
}
