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
  Component, OnInit, Input, ViewChild, AfterViewInit, ElementRef, // @angular/core
  OnChanges, SimpleChanges, SimpleChange                          // @angular/core
} from 'angular-libs';

/**************************************************************************************************/

/**
 * Displays account ids in blockie style. Angular component wrapper for
 * https://github.com/download13/blockies.
 *
 * Usage:
 *   <blockie-component class="small-blockie"
 *     [address]="accountId"
 *     [size]="8"
 *     [scale]="15">
 *   </blockie-component>
 *
 * @class      Component BlockieComponent
 */
@Component({
  selector: 'blockie-component',
  templateUrl: 'blockie.html'
})
export class BlockieComponent implements AfterViewInit, OnChanges {
  /***************** inputs & outpus *****************/ 
  /**
   * Address that should be displayed as an blockie
   */
  @Input() address: string;

  /**
   * width/height of the blockie
   */
  @Input() size: number;

  /**
   * width/height of each block in pixels, default: 5
   */
  @Input() scale: number;

  /*****************    variables    *****************/
  /**
   * blockie element references
   */
  @ViewChild('blockie') $blockie: ElementRef;

  /**
   * properties to check for updates
   */
  private changesProperties = [ 'address', 'size', 'scale' ];

  /***************** initialization  *****************/
  constructor() { }

  /**
   * Create the blockie after the wrapper element was rendered.
   */
  ngAfterViewInit() {
    this.createBlockie();
  }

/**
 * Check the changesProperties to update the blockie.
 *
 * @param      {SimpleChanges}  changes  SimpleChanges
 */
  ngOnChanges(changes: SimpleChanges) {
    const properties = Object.keys(changes);

    for (let i = 0; i < properties.length; i++) {
      if (changes[properties[i]]) {
        this[properties[i]] = changes[properties[i]].currentValue
      }
    }

    this.createBlockie();
  }

  /*****************    functions    *****************/
  /**
   * Creates the blockie element and applies it to the blockie element reference.
   */
  createBlockie() {
    const blockie = (<any>window).blockies.create({ // All options are optional
      seed: this.address, // seed used to generate icon data, default: random
      size: this.size || 8, // width/height of the icon in blocks, default: 8
      scale: this.scale || 4, // width/height of each block in pixels, default: 4

      // color: '#dfe', // to manually specify the icon color, default: random
      // bgcolor: '#aaa', // choose a different background color, default: random
      // spotcolor: '#000' // each pixel has a 13% chance of being of a third color,
      // // default: random. Set to -1 to disable it. These "spots" create structures
      // // that look like eyes, mouths and noses.
    });

    this.$blockie.nativeElement.parentElement.appendChild(blockie);
    this.$blockie.nativeElement.parentElement.removeChild(this.$blockie.nativeElement);
    this.$blockie.nativeElement = blockie;
  }
}
