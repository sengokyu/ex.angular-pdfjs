import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { getDocument } from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist/types/display/api';

const PDF_FILE_NAME = '/assets/RoShinoStdAdobeFonts.pdf';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('pdfCanvas')
  pdfCanvas: { nativeElement: HTMLCanvasElement };

  async ngAfterViewInit(): Promise<void> {
    this.showPdfPage(this.pdfCanvas.nativeElement, PDF_FILE_NAME, 1, 1);
  }

  private async showPdfPage(
    canvas: HTMLCanvasElement,
    url: string,
    scale: number,
    pageNumber: number
  ): Promise<void> {
    const pdf = await getDocument(url).promise;
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvasContext = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext, viewport }).promise;
  }
}
