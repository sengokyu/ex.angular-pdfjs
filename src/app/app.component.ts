import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  Sanitizer,
} from '@angular/core';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const PDF_FILE_NAME = '/assets/RoShinoStdAdobeFonts.pdf';
const STAMP_FILE_NAME = '/assets/stamp.png';
const STAMP_SIZE = 128;

interface position {
  left: number;
  top: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  isShowingCursor = false;
  cursorPos: position = { left: 0, top: 0 };
  pdfBlobUrl?: SafeResourceUrl;

  @ViewChild('pdfCanvas')
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  private pdfBlob?: Blob;
  private stampPngBuf?: ArrayBuffer;

  constructor(private domSanitizer: DomSanitizer) {}

  async ngOnInit(): Promise<void> {
    this.stampPngBuf = await fetch(STAMP_FILE_NAME).then((r) =>
      r.arrayBuffer()
    );
  }

  async ngAfterViewInit(): Promise<void> {
    const buf = await fetch(PDF_FILE_NAME).then((r) => r.arrayBuffer());
    this.pdfBlob = new Blob([buf], { type: 'application/pdf' });

    await this.renderPdf(1, 1);
    this.updateBlobUrl();
  }

  onMouseEnter(ev: MouseEvent): void {
    this.updateCursorPos(ev);
    this.showCursor();
  }

  onMouseLeave(): void {
    this.hideCursor();
  }

  onMouseMove(ev: MouseEvent): void {
    this.updateCursorPos(ev);
  }

  onClick(ev: MouseEvent): void {
    this.saveStamp(this.event2position(ev));
  }

  private updateCursorPos(ev: MouseEvent): void {
    this.cursorPos = this.event2position(ev);
  }

  private async saveStamp(pos: position): Promise<void> {
    const buf = await this.pdfBlob?.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buf!);
    const pngImage = await pdfDoc.embedPng(this.stampPngBuf!);
    const page = pdfDoc.getPage(0);

    pngImage.scale(1);
    page.drawImage(pngImage, {
      x: pos.left,
      y: page.getHeight() - pos.top - STAMP_SIZE,
      width: STAMP_SIZE,
      height: STAMP_SIZE,
    });

    const newBuf = await pdfDoc.save();
    this.pdfBlob = new Blob([newBuf], { type: 'application/pdf' });
    await this.renderPdf(1, 1);
    this.updateBlobUrl();
  }

  private showCursor(): void {
    this.isShowingCursor = true;
  }

  private hideCursor(): void {
    this.isShowingCursor = false;
  }

  private event2position(ev: MouseEvent): position {
    const rect = this.pdfCanvas.nativeElement.getBoundingClientRect();

    return {
      left: ev.clientX - rect.x - STAMP_SIZE,
      top: ev.clientY - rect.y - STAMP_SIZE,
    };
  }

  private updateBlobUrl(): void {
    this.pdfBlobUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(this.pdfBlob)
    );
  }

  private async renderPdf(pageNumber: number, scale: number): Promise<void> {
    const canvas = this.pdfCanvas.nativeElement;
    const url = URL.createObjectURL(this.pdfBlob);
    const pdf = await pdfjs.getDocument(url).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvasContext = canvas.getContext('2d')!;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext, viewport }).promise;
  }
}
