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
  Component, OnInit, Input, Output,  // @angular/core
  Observable, ChangeDetectorRef,
  EventEmitter
} from 'angular-libs';

import {
  EvanRoutingService
} from '../../services/ui/routing'

//TODO: this is not finished and not working!


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
  templateUrl: 'file-select.html'
})
export class EvanFileSelectComponent implements OnInit {
  /***************** inputs & outpus *****************/
  /**
   * this component is displayed like an ionic input, defines property or hides it
   */
  @Input() label: string;

  /**
   * files that should be uploaded
   */
  @Input() ngModel: Array<any>;

  /**
   * disable file select or not
   */
  @Input() disabled: boolean;

  /**
   * minimum amount of files that must be uploaded
   */
  @Input() minFiles: number;

  /**
   * maximum amount of files that can be uploaded
   */
  @Input() maxFiles: number;

  /*****************    variables    *****************/
  /**
   * check if min files and max files requirements are resolved
   */
  public isValid: boolean;
  /**
   * { item_description }
   */
  private files: Array<any>;

  /***************** initialization  *****************/
  constructor(
    private ref: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.ref.detach();

    this.files = [ ];
    this.ngModel = this.ngModel || [ ];

    this.setIsValid();

    this.ref.detectChanges();
  }

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

  }

  /**
   * Remove a newly selected file from the upload list
   */
  removeFiles(file: any) {
    this.files.splice(this.files.indexOf(file));
    this.ngModel.splice(this.ngModel.indexOf(file));
  }
}
