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
  Injectable,               // '@angular/core';
  TranslateService,         // @ngx-translate/core,
  AlertController, Alert,    // ionic-angular
  Injector,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  ApplicationRef,
  Component,
  DomSanitizer,
  Camera, Platform
} from 'angular-libs';

import { SnapshotDialogComponent } from '../../components/take-snapshot/take-snapshot';
import { SingletonService } from '../singleton-service';
import { EvanTranslationService } from './translate';
import { EvanUtilService } from '../utils';
import { EvanModalService } from './modal';

/**************************************************************************************************/

/**
 * Picture taking service for HTML 5 / IOS / Android.
 *
 * @class      Injectable EvanPictureService
 */
@Injectable()
export class EvanPictureService {
  /**
   * require dependencies
   */
  constructor(
    private modalService: EvanModalService,
    private _DomSanitizer: DomSanitizer,
    private utils: EvanUtilService,
    private cordovaCamera: Camera,
    private platform: Platform
  ) { }

  /**
   * Takes an img. On Desktop the webcam will be used. On mobile IOS / Android
   * internals will be used to access native cameras.
   *
   * Usage: const picture = await this.pictureService.takeSnapshot();
   *
   * @return     {Promise<any>}  the img data
   *   {
   *     name: 'capture.png',
   *     fileType: 'image/png',
   *     file: arrayBuffer,
   *     blobURI: this._DomSanitizer.bypassSecurityTrustUrl(dataUri)
   *   }
   */
  public async takeSnapshot(): Promise<any> {
    let picture;

    if (this.utils.isNativeMobile()) {
      // Create options for the Camera Dialog
      const options = {
        quality: 100,
        sourceType: this.cordovaCamera.PictureSourceType.CAMERA,
        saveToPhotoAlbum: false,
        correctOrientation: true
      };

      return new Promise((resolve, reject) => {
        // Get the data of an image
        this.cordovaCamera.getPicture(options).then(async (imagePath) => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', imagePath);
          xhr.responseType = 'blob';

          // create a new blob
          xhr.onload = () => {
            let fileReader = new FileReader();

            fileReader.onloadend = async (e) => {
              const arrayBuffer = (<any>e.target).result;
              const urlCreator = (<any>window).URL || (<any>window).webkitURL;
              const dataUri = urlCreator.createObjectURL(new Blob([arrayBuffer], {type: 'image/png'}));
              const resizedImageBlob = await this.resizeImage(dataUri);
              const resizedImageDataUri = urlCreator.createObjectURL(resizedImageBlob, {type: 'image/png'});
              const resizedImage = await this.blobToArrayBuffer(resizedImageBlob);
              resolve({
                name: 'capture.png',
                fileType: 'image/png',
                file: resizedImage,
                blobURI: this._DomSanitizer.bypassSecurityTrustUrl(resizedImageDataUri)
              });
            };

            fileReader.readAsArrayBuffer(xhr.response);
          };
          xhr.send();
        }, ex => reject(ex));
      })
    } else if (this.utils.isMobileIOS()) {
      // <input type="file" capture="camera" accept="image/*" id="cameraInput" name="cameraInput">
      const cameraInput = document.createElement('input');

      cameraInput.setAttribute('type', 'file');
      cameraInput.setAttribute('capture', 'camera');
      cameraInput.setAttribute('accept', 'image/*');

      return new Promise((resolve, reject) => {
        let resolved = false;
        const uploadCallback = () => {
          if (!resolved) {
            resolved = true;
            setTimeout(() => {
              window.removeEventListener('focus', uploadCallback);

              if (cameraInput.files && cameraInput.files.length > 0) {
                let fileReader = new FileReader();
                fileReader.onloadend = async (e) => {
                  const arrayBuffer = (<any>e.target).result;
                  const urlCreator = (<any>window).URL || (<any>window).webkitURL;
                  const dataUri = urlCreator.createObjectURL(new Blob([arrayBuffer], {type: 'image/png'}));
                  const resizedImageBlob = await this.resizeImage(dataUri);
                  const resizedImageDataUri = urlCreator.createObjectURL(resizedImageBlob, {type: 'image/png'});
                  const resizedImage = await this.blobToArrayBuffer(resizedImageBlob);
                  resolve({
                    name: 'capture.png',
                    fileType: 'image/png',
                    file: resizedImage,
                    blobURI: this._DomSanitizer.bypassSecurityTrustUrl(resizedImageDataUri)
                  });
                };
                fileReader.readAsArrayBuffer(cameraInput.files[0]);
              } else {
                reject();
              }
            }, 500);
          }
        }

        // add cancel listener
        window.addEventListener('focus', uploadCallback);
        cameraInput.addEventListener('change', uploadCallback);

        // trigger camerea opening
        cameraInput.click();
      });
    } else {
      picture = await this.modalService.createModal(SnapshotDialogComponent, {}, true);
      const urlCreator = (<any>window).URL || (<any>window).webkitURL;
      const dataUri = urlCreator.createObjectURL(new Blob([picture.file], {type: 'image/png'}));
      const resizedImageBlob = await this.resizeImage(dataUri);
      const resizedImageDataUri = urlCreator.createObjectURL(resizedImageBlob, {type: 'image/png'});
      const resizedImage = await this.blobToArrayBuffer(resizedImageBlob);
      picture.file = resizedImage;
      picture.blobURI = this._DomSanitizer.bypassSecurityTrustUrl(resizedImageDataUri);
    }

    return picture;
  }

  /**
   * Transform a blob uri from an dataUrl
   *
   * @param      {string}           dataUrl  data url that should be transformed
   * @return     {Promise<string>}  blob uri
   */
  public async getBlobUri(dataUrl: string): Promise<string> {
    const buffer = await this.dataURItoBlob(dataUrl);
    const urlCreator = (<any>window).URL || (<any>window).webkitURL;
    return urlCreator.createObjectURL(new Blob([buffer], {type: 'image/png'}));
  }

  /**
   * Transform a data uri in to an blob.
   *
   * @param      {string}        dataURI  data uri that should be transformed
   * @return     {Promise<any>}  transformed blob
   */
  public async dataURItoBlob(dataURI: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        // convert base64 to raw binary data held in a string
        const byteString = atob(dataURI.split(',')[1]);

        // separate out the mime component
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const _ia = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            _ia[i] = byteString.charCodeAt(i);
        }

        const dataView = new DataView(arrayBuffer);

        resolve(arrayBuffer);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  /**
   * Transforms an blob into an data uri.
   *
   * @param      {any}           blob     blob to transform
   * @return     {Promise<any>}  transformed data uri
   */
  public async blobToDataURI(blob) {
    return new Promise<any>((resolve, reject) => {
      const file = new FileReader();

      file.onload = (result) => {
        resolve((<FileReader>result.target).result);
      }

      file.readAsDataURL(blob);
    });
  }

  /**
   * Transforms an blob into an array bugffer.
   *
   * @param      {any}           blob     blob to transform
   * @return     {Promise<any>}  transformed array buffer
   */
  public async blobToArrayBuffer(blob) {
    return new Promise<any>((resolve, reject) => {
      const file = new FileReader();

      file.onload = (result) => {
        resolve((<FileReader>result.target).result);
      }

      file.readAsArrayBuffer(blob);
    });
  }

  /**
   * Takes an dataUri and resizes the img to an maximum px ratio of 1000px:1000px.
   *
   * @param      {string}  dataUri     Data Uri
   * @param      {any}     dimensions  dimensions to transform the picture to (default max_width:
   *                                   1000, max_height: 1000)
   * @return     {blob}    Returns the resized img as a blob.
   */
  public async resizeImage(dataUri: string, dimensions = {max_width: 1000, max_height: 1000}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = dataUri;
      img.onload = function() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const canvasCopy = document.createElement("canvas");
        const copyContext = canvasCopy.getContext("2d");
        let ratio = 1;

        if (img.width > dimensions.max_width) {
          ratio = dimensions.max_width / img.width;
        } else if (img.height > dimensions.max_height) {
          ratio = dimensions.max_height / img.height;
        }

        canvasCopy.width = img.width
        canvasCopy.height = img.height
        copyContext.drawImage(img, 0, 0)

        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        ctx.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvas.width, canvas.height)  
        canvas.toBlob((blob) => {
          resolve(blob);
        });
      }
    })

  }
}
