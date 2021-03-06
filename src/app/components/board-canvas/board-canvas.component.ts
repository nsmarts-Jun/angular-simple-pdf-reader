import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, Renderer2, ViewChild, HostListener } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, fromEvent } from 'rxjs';
import { pluck, takeUntil, distinctUntilChanged, debounceTime } from 'rxjs/operators';

import { CANVAS_CONFIG } from 'src/@pv/config/config';

import { CanvasService } from 'src/@pv/services/canvas/canvas.service';
import { RenderingService } from 'src/@pv/services/rendering/rendering.service';

import { EventBusService } from 'src/@pv/services/eventBus/event-bus.service';
import { EventData } from 'src/@pv/services/eventBus/event.class';

import { PdfStorageService } from 'src/@pv/storage/pdf-storage.service';

import { ViewInfoService } from 'src/@pv/store/view-info.service';



export interface DialogData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-board-canvas',
  templateUrl: './board-canvas.component.html',
  styleUrls: ['./board-canvas.component.scss']
})
export class BoardCanvasComponent implements OnInit, OnDestroy {

  private unsubscribe$ = new Subject<void>();


  // static: https://stackoverflow.com/questions/56359504/how-should-i-use-the-new-static-option-for-viewchild-in-angular-8

  @ViewChild('canvasContainer', { static: true }) public canvasContainerRef: ElementRef;
  @ViewChild('bg', { static: true }) public bgCanvasRef: ElementRef;
  @ViewChild('tmp', { static: true }) public tmpCanvasRef: ElementRef;


  canvasContainer: HTMLDivElement;
  bgCanvas: HTMLCanvasElement;
  tmpCanvas: HTMLCanvasElement;

  rendererEvent1: any;

  constructor(
    private viewInfoService: ViewInfoService,

    private canvasService: CanvasService,
    private pdfStorageService: PdfStorageService,
    private renderingService: RenderingService,
    private eventBusService: EventBusService,
    private renderer: Renderer2,

  ) {

  }

  // Resize Event Listener
  @HostListener('window:resize') resize() {
    const newWidth = window.innerWidth - CANVAS_CONFIG.sidebarWidth;
    const newHeight = window.innerHeight;
    // sidenav ????????? resize event ??????... ????????????.
    if (CANVAS_CONFIG.maxContainerWidth === newWidth && CANVAS_CONFIG.maxContainerHeight === newHeight) {
      return;
    }
    CANVAS_CONFIG.maxContainerWidth = newWidth;
    CANVAS_CONFIG.maxContainerHeight = newHeight;
    this.onResize();
  }

  ngOnInit(): void {

    this.initCanvasSet();

    ////////////////////////////////////////////////
    // Document??? Update ??? ?????? (zoom, page change ???)
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), pluck('pageInfo'), distinctUntilChanged())
      .subscribe((pageInfo) => {
        // ?????? ??????
        // .subcribe((viewInfo)) => {
        // if (viewInfo.isDocLoaded) {
        //   this.onChangePage();
        // }

        // ?????? load ?????? ??????????????? ?????? ??????
        // (doc change, page change, zoom change ???)
        if (pageInfo.currentDocId) {
          console.log(pageInfo.currentDocId)
          this.onChangePage();
        }

      });
    /////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    // continer scroll
    // thumbnail??? window ?????? ??????
    this.rendererEvent1 = this.renderer.listen(this.canvasContainer, 'scroll', event => {
      this.onScroll();
    });
    //////////////////////////////////////////////////

  }
  // end of ngOnInit



  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // render listener ??????
    this.rendererEvent1();

    // pdf memory release
    this.pdfStorageService.memoryRelease();

  }


  /**
   * ?????? Canvas ??????, Container Size ??????
   */
  initCanvasSet() {


    this.bgCanvas = this.bgCanvasRef.nativeElement;

    this.tmpCanvas = this.tmpCanvasRef.nativeElement;
    this.canvasContainer = this.canvasContainerRef.nativeElement;

    /* container size ?????? */
    CANVAS_CONFIG.maxContainerHeight = window.innerHeight; // pdf ???????????? ?????????
    CANVAS_CONFIG.maxContainerWidth = window.innerWidth - CANVAS_CONFIG.sidebarWidth;

    CANVAS_CONFIG.deviceScale = this.canvasService.getDeviceScale(this.bgCanvas);
  }


  /**
   *  ?????? + background drawing
   */

  /**
   * draw + pdf rendering
   *
   * @param currentDocNum
   * @param currentPage
   * @param zoomScale
   */
  async pageRender(currentDocNum, currentPage, zoomScale) {
    console.log('>>> page Render!');
    // ????????? ????????? ??????????????? ?????? ??? ??????????????? UI ?????? ?????? ?????? ?????? ??????
    await this.preRenderBackground(currentPage)
    // PDF Rendering
    this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage);

  }

  /**
     * Background pre rendering
     * - Main bg??? ????????? ?????? thumbnail image ???????????? ????????? ?????? ??????.
     * - UI ????????? ??????
     * @param pageNum page ??????
     */
  preRenderBackground(pageNum) {
    const targetCanvas = this.bgCanvas
    console.log(targetCanvas)
    const ctx = targetCanvas.getContext("2d");
    const imgElement: any = document.getElementById('thumb' + pageNum);
    if(imgElement != null){
        ctx.drawImage(imgElement, 0, 0, targetCanvas.width, targetCanvas.height);
    }

  }


  /**
   * ??? ?????? ?????????
   *
   */
  onResize() {
    // if (!this.viewInfoService.state.isDocLoaded) return;

    // Resize??? container size ??????.
    const ratio = this.canvasService.setContainerSize(this.canvasContainer);

    if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

    // thumbnail window ?????? ????????? ?????? ??????.
    this.eventBusService.emit(new EventData("change:containerSize", {
      ratio,
      coverWidth: this.canvasService.canvasFullSize.width,
    }));

  }

  /**
   * Scroll ?????? ???
   */
  onScroll() {
    if (this.viewInfoService.state.leftSideView != 'thumbnail') return;
    // if (!this.viewInfoService.state.isDocLoaded) return;

    this.eventBusService.emit(new EventData('change:containerScroll', {
      left: this.canvasContainer.scrollLeft,
      top: this.canvasContainer.scrollTop
    }))
  }


  /**
     * change Page : ?????? ????????? ?????? ???????????? ??????
     * - ?????? Load??? ??????
     * - ????????? ???????????? ??????
     * - ?????? ???????????? ??????
     * - scale ???????????? ??????
     */
  onChangePage() {
    // ???????????? ?????? ??? ??????????????????
    console.log(this.viewInfoService.state.pageInfo.currentDocId)
    if(this.viewInfoService.state.pageInfo.currentDocId == 'delete'){
      console.log('delete---------------------------')
      const bgCanvasContext = this.bgCanvas.getContext('2d');
      bgCanvasContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      bgCanvasContext.fillStyle = 'white';
      bgCanvasContext.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      const tmpCanvasContext = this.tmpCanvas.getContext('2d');
      tmpCanvasContext.clearRect(0, 0, this.tmpCanvas.width, this.tmpCanvas.height);
      tmpCanvasContext.fillStyle = 'white';
      bgCanvasContext.fillRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
      this.viewInfoService.state.pageInfo.currentDocId = null;
      return;
    }

    
    const pageInfo = this.viewInfoService.state.pageInfo;
    //document Number -> 1?????? ??????.
    const docNum = pageInfo.currentDocNum;
    const pageNum = pageInfo.currentPage;
    const zoomScale = pageInfo.zoomScale;
    console.log("docNum: ",docNum)
    console.log("pageNum: ",pageNum)
    console.log("zoomScale: ", zoomScale)
    console.log(`>> changePage to page: ${pageNum}, scale: ${zoomScale} `);

    // set Canvas Size
    const ratio = this.canvasService.setCanvasSize(docNum, pageNum, zoomScale, this.canvasContainer, this.bgCanvas);

    // BG & Board Render
    this.pageRender(docNum, pageNum, zoomScale);


    // Thumbnail window ??????
    if (this.viewInfoService.state.leftSideView === 'thumbnail') {
      this.eventBusService.emit(new EventData('change:containerSize', {
        ratio,
        coverWidth: this.canvasService.canvasFullSize.width
      }));
      // scroll bar??? ?????? ?????? page ?????? ??? ?????? ????????? ??????
      this.canvasContainer.scrollTop = 0;
      this.canvasContainer.scrollLeft = 0;
    };




  }

}