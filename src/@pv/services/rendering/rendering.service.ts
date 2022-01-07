import { ElementRef, Injectable, ViewChild, Renderer2, RendererFactory2 } from '@angular/core';
import { PdfStorageService } from '../../storage/pdf-storage.service';
import { CANVAS_CONFIG } from '../../config/config';


@Injectable({
  providedIn: 'root'
})
export class RenderingService {


  constructor(
    private pdfStorageService: PdfStorageService

  ) { }

  isPageRendering = false;
  pageNumPending: boolean = null;


  /**
   * Thumbnail의 배경 rendering
   * - canvas 대신 image 처리로 변경
   * @param {element} imgElement <img>
   * @param {number} pageNum 페이지 번호
   * @param {element} canvas <canvas>
   */
  async renderThumbBackground(imgElement, pdfNum, pageNum) {
    // console.log('> renderThumbnail Background');
    const pdfPage = this.pdfStorageService.getPdfPage(pdfNum, pageNum);


    // 배경 처리를 위한 임시 canvas
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext("2d");

    // 1/2 scale로 설정 (임시)
    const viewport = pdfPage.getViewport({ scale: 0.5 });
    tmpCanvas.width = viewport.width;
    tmpCanvas.height = viewport.height;

    try {
      const renderContext = {
        canvasContext: tmpCtx,
        viewport
      };
      /*-----------------------------------
        pdf -> tmpCanvas -> image element
        ! onload event는 굳이 필요없음.
      ------------------------------------*/
      await pdfPage.render(renderContext).promise;
      imgElement.src = tmpCanvas.toDataURL();

      return true;

    } catch (err) {
      console.log(err);
      return false;
    }
  }


  /**
   * Main Board의 Background rendering
   * - pending 처리 포함
   * @param pageNum page 번호
   */
  async renderBackground(tmpCanvas, bgCanvas, pageNum) {
    console.log(`>>>> renderBackground, pageNum: ${pageNum}`);

    /** 
    * 꼭 수정해야해------------------------------------------------------------
    *
    * 
    */ 
    const pdfPage = this.pdfStorageService.getPdfPage(bgCanvas, pageNum);
    if (!pdfPage) {
      return;
    }

    if (this.isPageRendering) {
      // console.log(' ---> pending!!! ');
      this.pageNumPending = pageNum;
    } else {
      this.isPageRendering = true;

      await this.rendering(pdfPage, bgCanvas, tmpCanvas);

      this.isPageRendering = false;

      if (this.pageNumPending) {
        this.renderBackground(tmpCanvas, bgCanvas, this.pageNumPending);
        this.pageNumPending = null;
      }
    }
  }



  /**
   * 공통 Rendering function
   * - tmpcanvas를 이용해서 target Canvas에 pdf draw
   * - 동일 size로 바로 rendering하는 경우 quality가 좋지 않음. (특히 text 문서의 경우.)
   * - pdf -> tmpCanvas -> targetCanvas
   * @param {pdfPage} page  pdfPage
   * @param {element} targetCanvas bgcanvas
   */
  async rendering(page, targetCanvas, tmpCanvas) {

    if (!page) {
      return false;
    }

    const viewport = page.getViewport({ scale: 1 });
    const ctx = targetCanvas.getContext('2d');

    const bgImgSize = { width: targetCanvas.width, height: targetCanvas.height };

    try {
      const scale = targetCanvas.width / viewport.width;
      let tmpCanvasScaling;

      // scale이 작을때만 tmpcanvas size increase... : 여러가지 추가 check. ~~ todo
      if (scale <= 2 * CANVAS_CONFIG.CSS_UNIT) {
        tmpCanvasScaling = Math.max(2, CANVAS_CONFIG.deviceScale);
      } else {
        tmpCanvasScaling = CANVAS_CONFIG.deviceScale;
      }

      // console.log('bgimgsize: ', bgImgSize);
      // console.log('device scale: ', CONFIG.deviceScale);

      // console.log('tmp canvas scaling: ', tmpCanvasScaling);

      tmpCanvas.width = bgImgSize.width * tmpCanvasScaling / CANVAS_CONFIG.deviceScale;
      tmpCanvas.height = bgImgSize.height * tmpCanvasScaling / CANVAS_CONFIG.deviceScale;

      // console.log('rendering tmpcanvas: ', tmpCanvas);

      const zoomScale = tmpCanvas.width / viewport.width;
      const tmpCtx = tmpCanvas.getContext('2d');
      const renderContext = {
        canvasContext: tmpCtx,
        viewport: page.getViewport({ scale: zoomScale })
      };

      // tmpCanvas에 pdf 그리기
      await page.render(renderContext).promise;

      /*-------------------------------------------------
        tmpCanvas => target Canvas copy
        --> 대기중인 image가 없는 경우에만 처리.
        ---> pre-render 기능을 사용하므로 최종 image만 그려주면 됨.
      -----------------------------------------------------------*/
      if (!this.pageNumPending) {
        ctx.drawImage(tmpCanvas, 0, 0, bgImgSize.width, bgImgSize.height);
        // clear tmpCtx
        tmpCtx.clearRect(0, 0, tmpCtx.width, tmpCtx.height);
      }

      return true;

    } catch (err) {
      console.log(err);
      return false;
    }
  }

}



