import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Input,
  inject,
} from '@angular/core';

interface Cell {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Directive({
  selector: '[appMasonry]',
  standalone: true,
})
export class MasonryDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;

  @Input() appMasonryColumns = 2;
  @Input() appMasonryGap = 0;
  /** Remplir la hauteur du parent (grille adaptative) */
  @Input() appMasonryFillHeight = true;

  ngAfterViewInit() {
    this.scheduleLayout();
    this.resizeObserver = new ResizeObserver(() => this.scheduleLayout());
    this.resizeObserver.observe(this.el.nativeElement);
    const parent = (this.el.nativeElement as HTMLElement).parentElement;
    if (parent) {
      this.resizeObserver.observe(parent);
    }
  }

  private scheduleLayout() {
    requestAnimationFrame(() => this.layout());
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private layout() {
    const container = this.el.nativeElement as HTMLElement;
    const items = Array.from(container.querySelectorAll<HTMLElement>('.gallery-item, .gallery-placeholder'));
    if (!items.length) return;

    const imgs = items.map((item) => item.querySelector<HTMLImageElement>('img')).filter(Boolean);
    const allLoaded = imgs.every((img) => img!.complete && img!.naturalWidth > 0);

    if (!allLoaded) {
      imgs.forEach((img) => {
        if (img && !img.dataset['masonryBound']) {
          img.dataset['masonryBound'] = '1';
          img.addEventListener('load', () => this.layout());
        }
      });
      return;
    }

    const containerWidth = container.offsetWidth;
    let containerHeight = container.offsetHeight;

    if (this.appMasonryFillHeight && containerHeight < 100) {
      const parent = container.parentElement;
      if (parent) {
        const parentHeight = parent.clientHeight;
        const label = parent.querySelector('.label');
        const labelHeight = label ? (label as HTMLElement).offsetHeight + 16 : 0;
        containerHeight = Math.max(parentHeight - labelHeight - 32, 200);
      }
    }

    const gap = this.appMasonryGap;
    const cols = this.getColumnCount(containerWidth);
    const aspectRatios = items.map((item) => {
      const img = item.querySelector<HTMLImageElement>('img');
      if (!img) return 1;
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      return h / w;
    });

    const cells = this.computeCells(cols, containerWidth, containerHeight, gap, aspectRatios);

    items.forEach((item, i) => {
      const cell = cells[i];
      if (!cell) return;

      item.style.position = 'absolute';
      item.style.left = `${cell.left}px`;
      item.style.top = `${cell.top}px`;
      item.style.width = `${cell.width}px`;
      item.style.height = `${cell.height}px`;
    });

    const totalHeight = this.appMasonryFillHeight
      ? containerHeight
      : Math.max(...cells.map((c) => c.top + c.height), 0);

    container.style.position = 'relative';
    container.style.height = `${totalHeight}px`;
  }

  private computeCells(
    cols: number,
    w: number,
    h: number,
    gap: number,
    aspectRatios: number[]
  ): Cell[] {
    const n = aspectRatios.length;
    const colWidth = (w - gap * (cols - 1)) / cols;
    const cells: Cell[] = [];

    if (cols === 2 && n === 4) {
      const leftRatios = aspectRatios[0] + aspectRatios[1];
      const rightRatios = aspectRatios[2] + aspectRatios[3];
      const h0 = h * (aspectRatios[0] / leftRatios);
      const h1 = h - h0;
      const h2 = h * (aspectRatios[2] / rightRatios);
      const h3 = h - h2;

      cells.push(
        { left: 0, top: 0, width: colWidth, height: h0 },
        { left: 0, top: h0 + gap, width: colWidth, height: h1 },
        { left: colWidth + gap, top: 0, width: colWidth, height: h2 },
        { left: colWidth + gap, top: h2 + gap, width: colWidth, height: h3 }
      );
    } else if (cols === 2 && n === 3) {
      const h0 = h * (aspectRatios[0] / (aspectRatios[0] + aspectRatios[1]));
      const h1 = h - h0;
      cells.push(
        { left: 0, top: 0, width: colWidth, height: h0 },
        { left: 0, top: h0 + gap, width: colWidth, height: h1 },
        { left: colWidth + gap, top: 0, width: colWidth, height: h }
      );
    } else if (cols === 2 && n === 2) {
      const h0 = h * (aspectRatios[0] / (aspectRatios[0] + aspectRatios[1]));
      const h1 = h - h0;
      cells.push(
        { left: 0, top: 0, width: colWidth, height: h0 },
        { left: colWidth + gap, top: 0, width: colWidth, height: h1 }
      );
    } else if (cols === 2 && n === 1) {
      cells.push({ left: 0, top: 0, width: w, height: h });
    } else {
      const colHeights: number[] = new Array(cols).fill(0);
      aspectRatios.forEach((ar, i) => {
        const minCol = colHeights.indexOf(Math.min(...colHeights));
        const itemHeight = colWidth * Math.min(ar, 2);
        const left = minCol * (colWidth + gap);
        const top = colHeights[minCol];
        colHeights[minCol] += itemHeight + gap;
        cells.push({ left, top, width: colWidth, height: itemHeight });
      });
    }

    return cells;
  }

  private getColumnCount(width: number): number {
    if (width < 768) return 2;
    return this.appMasonryColumns;
  }
}
