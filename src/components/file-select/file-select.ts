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
  ChangeDetectorRef,
  Component,
  ControlValueAccessor,
  DomSanitizer,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Observable,
  OnInit,
  Output,
  ViewChild,
} from 'angular-libs';

import {
  EvanRoutingService
} from '../../services/ui/routing'

import {
  EvanUtilService
} from '../../services/utils';


/**************************************************************************************************/
/**
 * file selector component for HTML 5 &IOS & Anroid
 * 
 * Usage:
 *   <evan-file-select
 *     [label]="'_dapptaskboard.files' | translate"
 *     [(ngModel)]="files"
 *     [minFiles]="1"
 *     [maxFiles]="10">
 *   </evan-file-select>
 *
 * @class      Component EvanFileSelectComponent
 */
@Component({
  selector: 'evan-file-select',
  templateUrl: 'file-select.html',
  providers: [
    { 
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EvanFileSelectComponent),
      multi: true,
    }
  ]
})
export class EvanFileSelectComponent implements OnInit, ControlValueAccessor {
  /***************** inputs & outpus *****************/
  /**
   * this component is displayed like an ionic input, defines property or hides it
   */
  @Input() label: string;

  /**
   * optional button text that should be displayed for the add button
   */
  @Input() buttonText: string;

  /**
   * files that should be uploaded
   */
  @Input() ngModel: Array<any>;

  /**
   * disable file select or not
   */
  @Input() disabled: boolean;

  /**
   * enable download of files
   */
  @Input() downloadable: boolean;

  /**
   * minimum amount of files that must be uploaded
   */
  @Input() minFiles: number;

  /**
   * maximum amount of files that can be uploaded
   */
  @Input() maxFiles: number;

  /**
   * Event emitter to tell using component, that something has changed
   */
  @Output() onChange: EventEmitter<any> = new EventEmitter();


  /*****************    variables    *****************/

  /**
   * input element for selection more items
   */
  @ViewChild('fileSelect') fileSelect: ElementRef;

  /**
   * check if min files and max files requirements are resolved
   */
  public isValid: boolean;

  /***************** initialization  *****************/
  constructor(
    private ref: ChangeDetectorRef,
    private utils: EvanUtilService,
    private _DomSanitizer: DomSanitizer,
  ) { }

  ngOnInit() {
    this.ref.detach();

    this.ngModel = this.ngModel || [ ];

    this.setIsValid();

    if (this.downloadable) {
      const urlCreator = (<any>window).URL || (<any>window).webkitURL;

      for (let file of this.ngModel) {
        let blob = file;
        if(file.file) {

          // check if the file is a JSON.parsed buffer and convert it back
          if(file.file.type === 'Buffer' && file.file.data) {
            file.file = new Uint8Array(file.file.data);
          }
          blob = new Blob([file.file], { type: file.type });
        }
        const blobUri = urlCreator.createObjectURL(blob);
        file.blobURI = this._DomSanitizer.bypassSecurityTrustUrl(blobUri);
      }
    }

    this.ref.detectChanges();
  }

  /**
   * Append this functions to handle a correct formular reaction including name, required and so on.
   */
  writeValue(value: any) {
    this.ngModel = value;
  }
  propagateChange = (_: any) => {};
  registerOnChange(fn) {
    this.propagateChange = fn;
  }
  registerOnTouched() {}

  /*****************    functions    *****************/
  setIsValid() {
    this.isValid = true;

    if (this.minFiles && this.ngModel.length < this.minFiles) {
      this.isValid = false;
    }

    if (this.maxFiles && this.ngModel.length > this.maxFiles) {
      this.isValid = false;
    }
  }

  /**
   * Add new files to the file upload list
   */
  selectFiles() {
    this.fileSelect.nativeElement.click();
  }

  /**
   * Is triggered when files were changed.
   */
  filesChanged($event) {
    for (let i = 0; i < $event.srcElement.files.length; i++) {
      const file = $event.srcElement.files[i];
      const found = this.ngModel.filter(existing => existing.name === file.name).length > 0;

      if (!found) {
        this.ngModel.push(file);
      }
    }

    this.onChange.emit();
    this.ref.detectChanges();
  }

  /**
   * Remove a newly selected file from the upload list
   *
   * @param      {file}    file    file object that should be removed
   * @param      {number}  index   index of the file within the ngModel
   */
  removeFile(file: any, index: number) {
    this.ngModel.splice(index, 1);

    this.onChange.emit();
    this.ref.detectChanges();
  }

  /**
   * Parse the file size to a human readable format
   *
   * @param      {number}  size    size in B
   * @return     {string}  XXX KB / XXX MB
   */
  parseFileSize(size: number) {
    if ((size / 1000000) > 1) {
      return `${ (size / 1000000).toFixed(2) } MB`;
    } else if ((size / 1000) > 1) {
      return `${ (size / 1000).toFixed(2) } KB`;
    } else {
      return `${ size.toFixed(2) }B`;
    }
  }
}
