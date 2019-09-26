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
  DomSanitizer,
  File,
  FileOpener,
  Injectable,
  OnDestroy,
} from 'angular-libs';

import { EvanUtilService } from '../utils';
import { EvanBCCService } from '../bcc/bcc';
import { EvanToastService } from '../ui/toast';
import { EvanTranslationService } from '../ui/translate';

// fix dordova file download event listeners
if (window['FileReader'] && window['cordova'] && !window['FileReaderFixed']) {
  const WrappedFileReader = window['FileReader'];

  window['FileReaderFixed'] = true;
  window['FileReader'] = function OriginalFileReader(...args) {
    WrappedFileReader.apply(this, args)
    return this[window['Zone'].__symbol__('originalInstance')] ||
      (this._realReader ? this._realReader[window['Zone'].__symbol__('originalInstance')] : null) ||
      this;
  };
}

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
    private bcc: EvanBCCService,
    private file: File,
    private toast: EvanToastService,
    private translateService: EvanTranslationService,
    private fileOpener: FileOpener,
    private _DomSanitizer: DomSanitizer
  ) { }

  /**
   * Uploads an array of fils that were selected with an HTML 5 <input type="file"> selector or using
   * the evan-file-select component and transforms them into an encryption object
   *
   * @param      {Array<any>}    files    array of files
   * @return     {Promise<any>}  uploaded files transformed into an encryption object 
   */
  public async readFilesAsArrayBuffer(files: Array<any>) {
    files = await Promise.all(
      files.map((file) => new Promise((resolve, reject) => {
        if (file.file) {
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

    // overwrite the attachments object with the crypto information, how the data needs to
    // be decrypted
    return files;
  }

  /**
   * Transform an array of files to be valid for display (including file, blob and blobURI)
   *
   * @param      {Array<any>}  files   array of files that should be checked
   * @return     {Array<any>}      array of valid files
   */
  public async equalizeFileStructure(files: Array<any>) {
    const urlCreator = (<any>window).URL || (<any>window).webkitURL;

    const transformed = [ ];
    for (let originalFile of files) {
      // copy the file to break original file instance and recursive structures
      const result: any = { };
      for (var fileProp in originalFile) {
        result[fileProp] = originalFile[fileProp];
      }

      // if a normal file object was applied, transform it!
      if (!result.file && !result.blob) {
        result.blob = originalFile;
      }

      if (result.file) {
        // check if the file is a JSON.parsed buffer and convert it back
        if (result.file.type === 'Buffer' && result.file.data) {
          result.file = new Uint8Array(result.file.data);
        }

        result.blob = new Blob([ result.file ], { type: result.type });
      }

      // transform the file into an ArrayBuffer to expect everywhere the same value
      result.file = await new Promise<any>((resolve, reject) => {
        const file = new FileReader();
        file.onload = (result) => resolve((<FileReader>result.target).result);
        file.readAsArrayBuffer(result.blob);
      });

      // set blob and blobUri
      result.blobUri = result.blobURI = this._DomSanitizer.bypassSecurityTrustUrl(
        urlCreator.createObjectURL(result.blob));

      transformed.push(result);
    }
    
    return transformed;
  }

  /**
   * Link element using blob uris and download flag does not work on mobile decives. Use this
   * funciton to download files on mobile devices
   *
   * @param      {string}  name    name of the file
   * @param      {Blob}    blob    Blob of the file
   */
  async downloadMobile(name: string, blob: any) {
    try {
      let downloadFolder;
      let index = 0;
      let fileExists = true;

      if (this.utils.isMobileAndroid()) {
        downloadFolder = this.file.externalRootDirectory + 'Download/';
      } else {
        downloadFolder = this.file.tempDirectory;
      }

      // get the file name without any extension so we can append download numbers if the file already
      // exists
      let withoutExtension: any = name.split('.');
      let extension = withoutExtension.pop();
      withoutExtension = withoutExtension.join('.');

      // get the file name including a counter
      let getFileName = () => {
        return withoutExtension + (index === 0 ? '' : ` (${ index })`) + `.${ extension }`;
      };

      // check if the file exists and update the counter
      while (fileExists) {
        try {
          await this.file.checkFile(downloadFolder, getFileName());
          index++;
        } catch (ex) {
          fileExists = false;
        }
      }

      // write the file
      await this.file.writeFile(
        downloadFolder,
        getFileName(),
        blob
      );

      // show toast if finished only on android, ios has no Download folder (???)
      if (this.utils.isMobileAndroid()) {
        this.toast.showToast({
          message: this.translateService.instant('_angularcore.finished-downloading', {
            fileName: getFileName()
          }),
          duration: 3000
        });
      }

      this.fileOpener.open(downloadFolder + '/' + getFileName(), blob.type);
    } catch (ex) {
      this.utils.log(this.utils.getErrorLog(ex), 'error');

      // show toast if finished
      this.toast.showToast({
        message: this.translateService.instant('_angularcore.error-downloading'),
        duration: 3000
      });
    }
  }
}
