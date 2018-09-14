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
  Injectable,        // '@angular/core';
  Slides
} from 'angular-libs';

import { SingletonService } from '../singleton-service';

/**************************************************************************************************/

/**
 * Ionic Slide helper service to work around Ionic bugs.
 *
 * @class      Injectable EvanSlidesService
 */
@Injectable()
export class EvanSlidesService {
  /**
   * require dependencies
   */
  constructor() { }

  /**
   * Use this function within your component to lock slides after
   * ngAfterViewInit to prevent weird slide behavior
   *
   * @param      {Slides}  slide   slides object to lock
   */
  afterViewInit(slide: Slides) {
    if (slide) {
      slide.lockSwipes(true);
    }
  }

  /**
   * Navigate to a specific slide
   *
   * @param      {Slide}   slide   slides to slide
   * @param      {number}  index   index of slide to slide to
   */
  goToSlide(slide: Slides, index: number) {
    try {
      slide.update();
      slide.lockSwipes(false);
      slide.slideTo(index);
      slide.lockSwipes(true);
      slide.update();

      const sliderWrapper: any = slide.container.getElementsByClassName('swiper-wrapper')[0];
      sliderWrapper.style['transition-duration'] = '300ms';
      sliderWrapper.style['transform'] = `translate3d(-${index * 100}%, 0px, 0px)`;
    } catch (ex) {
      console.log(ex)
    }
  }
}
