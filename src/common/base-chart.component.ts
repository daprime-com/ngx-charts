import {
  ElementRef, NgZone, ChangeDetectorRef, Component, Input,
  Output, EventEmitter, AfterViewInit, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';

import { fromEvent as observableFromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { VisibilityObserver } from '../utils';

@Component({
  selector: 'base-chart',
  template: `<div></div>`
})
export class BaseChartComponent implements OnChanges, AfterViewInit, OnDestroy {

  @Input() results: any;
  @Input() view: string[];
  @Input() scheme: any = 'cool';
  @Input() schemeType: string = 'ordinal';
  @Input() customColors: any;
  @Input() animations: boolean = true;

  @Output() select = new EventEmitter();

  width: number;
  height: number;
  resizeSubscription: any;
  visibilityObserver: VisibilityObserver;

  constructor(
    protected chartElement: ElementRef,
    protected zone: NgZone,
    protected cd: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    this.bindWindowResizeEvent();

    // listen for visibility of the element for hidden by default scenario
    this.visibilityObserver = new VisibilityObserver(this.chartElement, this.zone);
    this.visibilityObserver.visible.subscribe(this.update.bind(this));
  }

  ngOnDestroy(): void {
    this.unbindEvents();
    if (this.visibilityObserver) {
      this.visibilityObserver.visible.unsubscribe();
      this.visibilityObserver.destroy();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.update();
  }

  update(): void {
    if (this.results) {
      this.results = this.cloneData(this.results);
    } else {
      this.results =  [];
    }

    let width: any;
    let height: any;

    if (this.view) {
      width = this.view[0];
      height = this.view[1];
    }

    if (!this.view || width === 'auto' || height === 'auto') {
      const dims = this.getContainerDims();
      if (dims) {
      	if (!width || width === 'auto') {
      		width = dims.width;
		}

      	if (!height || height === 'auto') {
			height = dims.height;
		}
      }
    }

    // default values if width or height are 0 or undefined
    if (!width) {
      width = '600';
    }

    if (!height) {
      height = '400';
    }

    this.width = Math.floor(width);
    this.height = Math.floor(height);

    if (this.cd) {
      this.cd.markForCheck();
    }
  }

  getContainerDims(): any {
    let width;
    let height;
    const hostElem = this.chartElement.nativeElement;

    if (hostElem.parentNode !== null) {
      // Get the container dimensions
      const dims = hostElem.parentNode.getBoundingClientRect();
      width = dims.width;
      height = dims.height;
    }

    if (width && height) {
      return { width, height };
    }

    return null;
  }

  /**
   * Converts all date objects that appear as name
   * into formatted date strings
   */
  formatDates(): void {
    for (let i = 0; i < this.results.length; i++) {
      const g = this.results[i];

      if (g.name instanceof Date) {
        g.name = g.name.toLocaleDateString();
      }

      if (g.series) {
        for (let j = 0; j < g.series.length; j++) {
          const d = g.series[j];
          if (d.name instanceof Date) {
            d.name = d.name.toLocaleDateString();
          }
        }
      }
    }
  }

  protected unbindEvents(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  private bindWindowResizeEvent(): void {
    const source = observableFromEvent(window, 'resize');
    const subscription = source.pipe(debounceTime(200)).subscribe(e => {
      this.update();
      if (this.cd) {
        this.cd.markForCheck();
      }
    });
    this.resizeSubscription = subscription;
  }

  /**
   * Clones the data into a new object
   *
   * @private
   * @param {any} data
   * @returns {*}
   *
   * @memberOf BaseChart
   */
  private cloneData(data): any {
    const results = [];

    for (const item of data) {
      const copy = {
        name: item['name']
      };

      if (item['value'] !== undefined) {
        copy['value'] = item['value'];
      }

      if (item['series'] !== undefined) {
        copy['series'] = [];
        for (const seriesItem of item['series']) {
          const seriesItemCopy = Object.assign({}, seriesItem);
          copy['series'].push(seriesItemCopy);
        }
      }

      if(item['extra'] !== undefined) {
        copy['extra'] = JSON.parse(JSON.stringify(item['extra']));
      }

      results.push(copy);
    }

    return results;
  }

}
