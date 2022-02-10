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
    // sidenav 열릴때 resize event 발생... 방지용도.
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
    // Document가 Update 된 경우 (zoom, page change 등)
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), pluck('pageInfo'), distinctUntilChanged())
      .subscribe((pageInfo) => {
        // 이전 코드
        // .subcribe((viewInfo)) => {
        // if (viewInfo.isDocLoaded) {
        //   this.onChangePage();
        // }

        // 초기 load 포함 변경사항에 대해 수행
        // (doc change, page change, zoom change 등)
        if (pageInfo.currentDocId) {
        //   console.log(pageInfo.currentDocId)
          this.onChangePage();
        }

      });
    /////////////////////////////////////////////////////////////

    ///////////////////////////////////////////////////
    // continer scroll
    // thumbnail의 window 처리 용도
    this.rendererEvent1 = this.renderer.listen(this.canvasContainer, 'scroll', event => {
      this.onScroll();
    });
    //////////////////////////////////////////////////

  }
  // end of ngOnInit



  ngOnDestroy() {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // render listener 해제
    this.rendererEvent1();

    // pdf memory release
    this.pdfStorageService.memoryRelease();

  }


  /**
   * 초기 Canvas 변수, Container Size 설정
   */
  initCanvasSet() {


    this.bgCanvas = this.bgCanvasRef.nativeElement;

    this.tmpCanvas = this.tmpCanvasRef.nativeElement;
    this.canvasContainer = this.canvasContainerRef.nativeElement;

    /* container size 설정 */
    CANVAS_CONFIG.maxContainerHeight = window.innerHeight; // pdf 불러오기 사이즈
    CANVAS_CONFIG.maxContainerWidth = window.innerWidth - CANVAS_CONFIG.sidebarWidth;

    CANVAS_CONFIG.deviceScale = this.canvasService.getDeviceScale(this.bgCanvas);
  }


  /**
   *  판서 + background drawing
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
    // 화면을 급하게 확대하거나 축소 시 깜빡거리는 UI 측면 문제 해결 위한 함수
    await this.preRenderBackground(currentPage)
    // PDF Rendering
    this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage);

  }

  /**
     * Background pre rendering
     * - Main bg를 그리기 전에 thumbnail image 기준으로 배경을 미리 그림.
     * - UI 측면의 효과
     * @param pageNum page 번호
     */
  preRenderBackground(pageNum) {
    const targetCanvas = this.bgCanvas
    // console.log(targetCanvas)
    const ctx = targetCanvas.getContext("2d");
    const imgElement: any = document.getElementById('thumb' + pageNum);
    if(imgElement != null){
        ctx.drawImage(imgElement, 0, 0, targetCanvas.width, targetCanvas.height);
    }

  }


  /**
   * 창 크기 변경시
   *
   */
  onResize() {
    // if (!this.viewInfoService.state.isDocLoaded) return;

    // Resize시 container size 조절.
    const ratio = this.canvasService.setContainerSize(this.canvasContainer);

    if (this.viewInfoService.state.leftSideView != 'thumbnail') return;

    // thumbnail window 크기 변경을 위한 처리.
    this.eventBusService.emit(new EventData("change:containerSize", {
      ratio,
      coverWidth: this.canvasService.canvasFullSize.width,
    }));

  }

  /**
   * Scroll 발생 시
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
     * change Page : 아래 사항에 대해 공통으로 사용
     * - 최초 Load된 경우
     * - 페이지 변경하는 경우
     * - 문서 변경하는 경우
     * - scale 변경하는 경우
     */
  onChangePage() {
    // 다큐먼트 삭제 시 캔버스지우기
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
    //document Number -> 1부터 시작.
    const docNum = pageInfo.currentDocNum;
    const pageNum = pageInfo.currentPage;
    const zoomScale = pageInfo.zoomScale;
    // console.log("docNum: ",docNum)
    // console.log("pageNum: ",pageNum)
    // console.log("zoomScale: ", zoomScale)
    // console.log(`>> changePage to page: ${pageNum}, scale: ${zoomScale} `);

    // set Canvas Size
    const ratio = this.canvasService.setCanvasSize(docNum, pageNum, zoomScale, this.canvasContainer, this.bgCanvas);

    // BG & Board Render
    this.pageRender(docNum, pageNum, zoomScale);


    // Thumbnail window 조정
    if (this.viewInfoService.state.leftSideView === 'thumbnail') {
      this.eventBusService.emit(new EventData('change:containerSize', {
        ratio,
        coverWidth: this.canvasService.canvasFullSize.width
      }));
      // scroll bar가 있는 경우 page 전환 시 초기 위치로 변경
      this.canvasContainer.scrollTop = 0;
      this.canvasContainer.scrollLeft = 0;
    };




  }

}