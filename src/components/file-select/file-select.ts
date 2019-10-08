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

import {
  EvanFileService
} from '../../services/ui/files'

import { AsyncComponent } from '../../classes/AsyncComponent';

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
export class EvanFileSelectComponent extends AsyncComponent implements ControlValueAccessor {
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
   * input type="file" accept attribute
   */
  @Input() accept: string;

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
   * are multiple files allowed?
   */
  @Input() multiple: boolean = true;

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
   * dropArea for files
   */
  @ViewChild('dropArea') dropArea: ElementRef;

  /**
   * check if min files and max files requirements are resolved
   */
  public isValid: boolean;

  /**
   * true when file selector was opened initially
   */
  public touched: boolean;

  /**
   * From ControlValueAccessor interface
   */
  private onTouchedCallback: Function;

  /**
   * allow the drop of files
   */
  private allowDropZone: boolean;

  /**
   * only deny drop, if one second after the event triggered, no dragover event occures
   */
  private denyDropTimeout: any;

  /***************** initialization  *****************/
  constructor(
    private _DomSanitizer: DomSanitizer,
    private fileService: EvanFileService,
    private ref: ChangeDetectorRef,
    private utils: EvanUtilService,
  ) {
    super(ref);
  }

  async _ngOnInit() {
    this.ngModel = this.ngModel || [ ];

    this.setIsValid();

    if (this.downloadable) {
      const urlCreator = (<any>window).URL || (<any>window).webkitURL;

      for (let i = 0; i < this.ngModel.length; i++) {
        this.ngModel[i] = (await this.fileService.equalizeFileStructure([ this.ngModel[i] ]))[0];
      }
    }
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
  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  /*****************    functions    *****************/
  /**
   * Is everything is valid?
   *
   * @return     {<type>}  { description_of_the_return_value }
   */
  setIsValid() {
    // if is valid was set before (not first time) set the is touched 
    if (typeof this.isValid !== 'undefined') {
      this.touched = true;
    }

    this.isValid = true;

    if (this.minFiles && this.ngModel.length < this.minFiles) {
      this.isValid = false;
    }

    if (this.maxFiles && this.ngModel.length > this.maxFiles) {
      this.isValid = false;
    }

    this.onChange.emit(this.ngModel);
    this.ref.detectChanges();
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
    // if only one file should be selected, clear the input
    if (!this.multiple) {
      this.ngModel.splice(0, this.ngModel.length);
    }

    var target = $event.target || $event.srcElement;
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i];
      const found = this.ngModel.filter(existing => existing.name === file.name).length > 0;

      if (!found) {
        this.ngModel.push(file);
      }
    }

    // set is valid
    this.setIsValid();

    // reset the file input array
    this.fileSelect.nativeElement.value = "";

    this.onChange.emit(this.ngModel);
    this.ref.detectChanges();
  }

  /**
   * Is triggered when files were dropped.
   */
  filesDropped($event) {
    if (this.disabled) {
      return;
    }
    // if only one file should be selected, clear the input
    if (!this.multiple) {
      this.ngModel.splice(0, this.ngModel.length);
    }

    // stop event bubbling
    $event.preventDefault();
    $event.stopPropagation();

    for (let i = 0; i < $event.dataTransfer.files.length; i++) {
      const file = $event.dataTransfer.files[i];
      const found = this.ngModel.filter(existing => existing.name === file.name).length > 0;

      if (!found) {
        this.ngModel.push(file);
      }
    }

    this.allowDropZone = false;

    this.onChange.emit(this.ngModel);
    this.ref.detectChanges();
  }

  /**
   * allows the drop of files
   *
   * @param      {object}  ev      drop event
   */
  allowDrop(ev) {
    if (this.disabled) {
      return;
    }

    if (this.denyDropTimeout) {
      window.clearTimeout(this.denyDropTimeout);
    }

    ev.preventDefault();
    this.allowDropZone = true;
    this.ref.detectChanges();
  }

  /**
   * deny the drop of files
   *
   * @param      {object}  ev      drop event
   */
  denyDrop(ev) {
    if (this.disabled) {
      return;
    }

    if (this.denyDropTimeout) {
      window.clearTimeout(this.denyDropTimeout);
    }

    this.denyDropTimeout = setTimeout(() => {
      ev.preventDefault();
      this.allowDropZone = false;
      this.ref.detectChanges();
    }, 100);
  }

  /**
   * Remove a newly selected file from the upload list
   *
   * @param      {file}    file    file object that should be removed
   * @param      {number}  index   index of the file within the ngModel
   */
  removeFile(file: any, index: number) {
    this.ngModel.splice(index, 1);
    this.setIsValid();

    this.onChange.emit(this.ngModel);
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
