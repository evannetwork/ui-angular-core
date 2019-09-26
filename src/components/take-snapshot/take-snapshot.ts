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
  Component, OnInit, OnDestroy, // @angular/core
  Router, NavigationEnd,        // @angular/router
  AfterViewInit, ElementRef, Input, DomSanitizer,
  ChangeDetectorRef
} from 'angular-libs';

import { EvanAddressBookService } from '../../services/bcc/address-book';
import { EvanTranslationService } from '../../services/ui/translate';
import { EvanUtilService } from '../../services/utils';
import { createOpacityTransition } from '../../animations/opacity';


/**
 * Component options structure interface
 */
export interface Options {
  video: boolean | any;
  cameraType: string;
  audio: boolean;
  width: number;
  height: number;
  fallbackSrc: string;
  fallbackMode: string;
  fallbackQuality: number;
}

/**
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices
 */
interface MediaDevice {
  deviceId: string;
  kind: string;
  label: string;
}

/**************************************************************************************************/

/**
 * Component to take pictures using HTML 5.
 * 
 * Usage:
 *   picture = await this.modalService.createModal(SnapshotDialogComponent, {});
 *
 * @class      Component SnapshotDialogComponent
 */
@Component({
  selector: 'snapshot-dialog',
  templateUrl: 'take-snapshot.html',
  animations: [
    createOpacityTransition()
  ]
})
export class SnapshotDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  /*****************    variables    *****************/
  /**
   * loading indicator
   */
  private loading: boolean;

  /**
   * resolvle function that is applied from modal service
   */
  private resolveDialog: Function;

  /**
   * reject function that is applied from modal service
   */
  private rejectDialog: Function;

  /**
   * current video stream of the camera
   */
  private stream: any;

  /**
   * camera device index (0, 1)
   */
  private streamIndex: number;

  /**
   * browser type
   */
  public browser: any;

  /**
   * active camerea
   */
  public camera: any;

  /**
   * isSupportWebRTC
   */
  public isSupportWebRTC: boolean;

  /**
   * camera stream options
   */
  public options: any;

  /**
   * camera ion-select options 
   */
  public selectOptions: any;

  /**
   * video src
   */
  public videoSrc: any;

  /**
   * trigger scale(1) transition animation
   */
  private showAnimation: boolean;

  /***************** initialization  *****************/
  constructor(
    private addressBook: EvanAddressBookService,
    private translate: EvanTranslationService,
    private element: ElementRef,
    private sanitizer: DomSanitizer,
    private utils: EvanUtilService,
    private ref: ChangeDetectorRef
  ) { }

  /**
   * initializes cameras and test browser for camerea support
   */
  ngOnInit() {
    this.isSupportWebRTC = false;
    this.options = {
      audio: false,
      video: true,
      videoStreams: []
    };
    this.videoSrc = undefined;

    this.selectOptions = {
      mode: 'popover'
    };

    this.browser = <any>navigator;
    this.streamIndex = this.streamIndex || 0;

    // getUserMedia() feature detection for older browser
    this.browser.getUserMedia_ = (this.browser.getUserMedia
    || this.browser.webkitGetUserMedia
    || this.browser.mozGetUserMedia
    || this.browser.msGetUserMedia);

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if ((this.browser.mediaDevices === undefined) && !!this.browser.getUserMedia_) {
      this.browser.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if ((this.browser.mediaDevices && this.browser.mediaDevices.getUserMedia === undefined) && !!this.browser.getUserMedia_) {
      this.browser.mediaDevices.getUserMedia = (constraints) => {
        return new Promise((resolve, reject) => {
          this.browser.getUserMedia_.call(this.browser, constraints, resolve, reject);
        });
      }
    }

    this.isSupportWebRTC = !!(this.browser.mediaDevices && this.browser.mediaDevices.getUserMedia);
    this.options.width = this.options.width || 320;
    this.options.height = this.options.height || 240;
    this.options.cameraType = this.options.cameraType  || 'back';

    this.showAnimation = true;
    this.ref.detectChanges();
  }

  /**
   * start video capturing when canvas elements were rendered 
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  ngAfterViewInit() {
    this.startCapturingVideo();
  }

  /**
   * close camerea stream
   */
  ngOnDestroy() {
    this.stopCapturing();
  }

  /*****************    functions    *****************/
  /**
   * Switch to facing mode and setup web camera
   */
  onWebRTC(): any {
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices
    if (this.browser.mediaDevices.enumerateDevices && this.options.video) {
      const cameraType = this.options.cameraType;
      this.browser.mediaDevices.enumerateDevices().then((devices) => {
        this.options.streams = [];
        devices.forEach((device: MediaDevice) => {
          if (device && device.kind === 'videoinput') {
            this.options.streams.push(device);
          }
        });
        this.camera = this.options.streams[this.streamIndex];
        this.setWebcam();
      });
    } else {
   //   this.setWebcam();
    }
  }

  /**
   * use next available camera
   */
  async switchCamera() {
    for (let i = 0; i < this.options.streams.length; i++) {
      if (this.camera !== this.options.streams[i]) {
        this.streamIndex = i;

        return new Promise(async (resolve) => {
          this.ngOnDestroy();
          this.isSupportWebRTC = false;
          await this.utils.timeout(0);

          this.ngOnInit();
          await this.utils.timeout(0);

          this.ngAfterViewInit();
        });
      }
    }
  }

  /**
   * Setup web camera using native browser API
   */
  setWebcam(): any {
    // constructing a getUserMedia config-object and
    // an string (we will try both)
    let optionObject = { audio: false, video: false };
    let optionString = '';
    let container: any, video: any, ow: any, oh: any;

    if (this.options.video) {
      if (this.streamIndex === 0) {
        optionObject.video = <any>{ facingMode: 'environment' };
      } else {
        optionObject.video = <any>{ facingMode: 'user' };
      }

      optionString = 'video';
    }
    if (this.options.audio === true) {
      optionObject.audio = true;
      if (optionString !== '') {
        optionString = optionString + ', ';
      }
      optionString = optionString + 'audio';
    }

    container = this.element.nativeElement.querySelector('.evan-modal');
    video = this.element.nativeElement.querySelector('video');
    video.autoplay = true;
    // Fix for ratio
    ow = parseInt(container.offsetWidth, 10);
    oh = parseInt(container.offsetHeight, 10);

    if (this.options.width < ow && this.options.height < oh) {
      this.options.width = ow;
      this.options.height = oh;
    }

    // configure the interim video
    video.width = this.options.width;
    video.height = this.options.height;
    video.autoplay = true;

    // Promisify async callback's for angular2 change detection
    const promisifyGetUserMedia = () => {
      return new Promise<string>((resolve, reject) => {
        // first we try if getUserMedia supports the config object
        try {
          // try object
          this.browser.mediaDevices.getUserMedia(optionObject)
            .then((stream: any) => {
              this.stream = stream;
              resolve(this.stream);
            })
            .catch((objErr: any) => {
              // option object fails
              // try string syntax
              // if the config object failes, we try a config string
              this.browser.mediaDevices.getUserMedia(optionObject)
                .then((stream: any) => resolve(stream))
                .catch((strErr: any) => {

                  console.error(objErr);
                  console.error(strErr);

                  reject(new Error('Both configs failed. Neither object nor string works'));
              });
          });
        } catch (e) {
          reject(e);
        }
      });
    };

    promisifyGetUserMedia().then(async (stream) => {
      this.videoSrc = stream;
      this.ref.detectChanges();
    }).catch((err) => {
      this.rejectDialog(err);
    });
  }

  /**
   * Start capturing video stream
   */
  startCapturingVideo(): any {
    if (this.isSupportWebRTC) {
      return this.onWebRTC();
    }
    console.error('WebCam not supported');
  }

  /**
   * close active camera stream
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  stopCapturing(): any {
    if (!!this.stream ) {
      const checker = typeof this.stream.getVideoTracks === 'function';
      if (this.stream.getVideoTracks && checker) {
        // get video track to call stop in it
        // videoStream.stop() is deprecated and may be removed in the
        // near future
        // ENSURE THIS IS CHECKED FIRST BEFORE THE FALLBACK
        // videoStream.stop()
        const tracks = this.stream.getVideoTracks();
        if (tracks && tracks[0] && tracks[0].stop) {
          tracks[0].stop();
        }
      } else if (this.stream.stop) {
        // deprecated, may be removed in the near future
        this.stream.stop();
      }
    }
  }

  /**
   * resolve the dialoag and return the snapshot
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  async finish() {
    this.loading = true;
    try {
      this.resolveDialog(this.takeSnapshot());
    } catch (ex) { }
    this.loading = false;
  }

  /**
   * get the img data from the current canvas
   *
   * @return     {any}  img data
   */
  async takeSnapshot(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      try {
        const video = this.element.nativeElement.querySelector('video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (video) {
          // copy full video frame into the canvas
          canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

          // get image data URL and remove canvas
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            function onLoadEnd (e) {
              reader.removeEventListener('loadend', onLoadEnd, false)
              if (e.error) {
                reject(e.error)
              } else {
                const ret = {
                  name: 'capture.png',
                  fileType: 'image/png',
                  file: reader.result
                }
                resolve(ret)
              }
            }
            reader.addEventListener('loadend', onLoadEnd, false)
            reader.readAsArrayBuffer(blob)
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * get maximum video height to prevent dialog scrolling
   */
  videoMaxHeight() {
    return Math.round(document.body.offsetHeight * 0.7) + 'px';
  }
}
