import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ElementRef,
  inject,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

@Component({
  selector: 'app-minimap',
  standalone: true,
  template: `<div #mapContainer class="minimap-container"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .minimap-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class Minimap implements AfterViewInit, OnDestroy, OnChanges {
  private el = inject(ElementRef);
  private map: Map | null = null;

  @Input() coords = '';

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['coords'] && !changes['coords'].firstChange && this.map) {
      this.updateCenter();
    }
  }

  ngOnDestroy() {
    this.map?.setTarget(undefined);
    this.map = null;
  }

  private parseCoords(coords: string): [number, number] | null {
    const match = coords.match(/([\d.,-]+)\s*°?\s*[NS]?,\s*([\d.,-]+)\s*°?\s*[EW]?/i);
    if (!match) return null;
    const lat = parseFloat(match[1].replace(',', '.'));
    const lng = parseFloat(match[2].replace(',', '.'));
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lng, lat];
  }

  private initMap() {
    const [lng, lat] = this.parseCoords(this.coords) ?? [6.0, 44.0];
    const center = fromLonLat([lng, lat]);

    const marker = new Feature({
      geometry: new Point(center),
    });

    const vectorSource = new VectorSource({ features: [marker] });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#1a1a1a' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    });

    const container = this.el.nativeElement.querySelector('.minimap-container');
    if (!container) return;

    this.map = new Map({
      target: container,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center,
        zoom: 12,
      }),
    });
  }

  private updateCenter() {
    const [lng, lat] = this.parseCoords(this.coords) ?? [6.0, 44.0];
    const center = fromLonLat([lng, lat]);
    const vectorLayer = this.map!.getLayers().item(1) as VectorLayer<VectorSource<Feature>>;
    const source = vectorLayer.getSource();
    source?.clear();
    source?.addFeature(
      new Feature({ geometry: new Point(center) })
    );
    this.map!.getView().setCenter(center);
  }
}
