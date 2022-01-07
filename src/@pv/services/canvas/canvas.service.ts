import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PdfStorageService } from '../../storage/pdf-storage.service';
import { CANVAS_CONFIG } from '../../config/config';

@Injectable({
	providedIn: 'root'
})
export class CanvasService {

	listenerSet = [];
	zoomScale = 1;

  _canvasFullSize;

	constructor(
		private pdfStorageService: PdfStorageService
	) { }



  get canvasFullSize(): any {
    return this._canvasFullSize;
  }

	getDeviceScale(canvas) {
		const ctx = canvas.getContext('2d');
		// https://www.html5rocks.com/en/tutorials/canvas/hidpi/
		const devicePixelRatio = window.devicePixelRatio || 1;
		const backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1;

		let deviceScale = 1;
		// ios의 경우는 어떤지 학생으로 check ~~ todo
		if (navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1) {
			deviceScale = devicePixelRatio / backingStoreRatio;
		}

		return deviceScale;
	}

	/*--------------------------------------
			getThumbnailSize
			- 각 thumbnail 별 canvas width/height
		----------------------------------------*/
	getThumbnailSize(docNum,pageNum) {
		const viewport = this.pdfStorageService.getViewportSize(docNum,pageNum);

		const size = {
			width: 0,
			height: 0,
			scale: 1 // thumbnail draw에서 사용할 scale (thumbnail과 100% pdf size의 비율)
		};

		// landscape 문서 : 가로를 150px(thumbnailMaxSize)로 설정
		if (viewport.width > viewport.height) {
			size.width = CANVAS_CONFIG.thumbnailMaxSize;
			size.height = size.width * viewport.height / viewport.width;
		}
		// portrait 문서 : 세로를 150px(thumbnailMaxSize)로 설정
		else {
			size.height = CANVAS_CONFIG.thumbnailMaxSize;
			size.width = size.height * viewport.width / viewport.height;
		}
		size.scale = size.width / (viewport.width * CANVAS_CONFIG.CSS_UNIT);

		return size;
	}

	/**
	 * Main container관련 canvas Size 설정
	 *
	 */
	setCanvasSize(pdfNum, pageNum, zoomScale, canvasContainer, bgCanvas) {
	console.log(`>>> set Canvas Size: pdfNum:${pdfNum}, pageNum:${pageNum}`)

    const pdfPage = this.pdfStorageService.getPdfPage(pdfNum, pageNum);
		const canvasFullSize = pdfPage.getViewport({scale:zoomScale * CANVAS_CONFIG.CSS_UNIT});
		canvasFullSize.width = Math.round(canvasFullSize.width);
		canvasFullSize.height = Math.round(canvasFullSize.height);

		/*------------------------------------
			container Size
			- 실제 canvas 영역을 고려한 width와 height
			- deviceScale은 고려하지 않음
		-------------------------------------*/
		const containerSize = {
			width: Math.min(CANVAS_CONFIG.maxContainerWidth, canvasFullSize.width),
			height: Math.min(CANVAS_CONFIG.maxContainerHeight, canvasFullSize.height)
		};

		// Canvas Container Size 조절
		canvasContainer.style.width = containerSize.width + 'px';
		canvasContainer.style.height = containerSize.height + 'px';



		// container와 canvas의 비율 => thumbnail window에 활용
		const ratio = {
			w: containerSize.width / canvasFullSize.width,
			h: containerSize.height / canvasFullSize.height
		};

		/*---------------------------------------
			현재 page에 대한 background size 설정
		----------------------------------------*/
		bgCanvas.width = canvasFullSize.width * CANVAS_CONFIG.deviceScale;
		bgCanvas.height = canvasFullSize.height * CANVAS_CONFIG.deviceScale;
		bgCanvas.style.width = canvasFullSize.width + 'px';
		bgCanvas.style.height = canvasFullSize.height + 'px';


    // data update
    this._canvasFullSize = canvasFullSize;


		return ratio;
	}


	/**
		 * Canvas Container size 설정
		 *  - resize인 경우
		 */
	setContainerSize(canvasContainer) {
		/*------------------------------------
			container Size
			- 실제 canvas 영역을 고려한 width와 height
		-------------------------------------*/
		const containerSize = {
			width: Math.min(CANVAS_CONFIG.maxContainerWidth, this.canvasFullSize.width),
			height: Math.min(CANVAS_CONFIG.maxContainerHeight, this.canvasFullSize.height)
		};


		// Canvas Container Size 조절
		canvasContainer.style.width = containerSize.width + 'px';
		canvasContainer.style.height = containerSize.height + 'px';


		// container와 canvas의 비율 => thumbnail window에 활용
		const ratio = {
			w: containerSize.width / this.canvasFullSize.width,
			h: containerSize.height / this.canvasFullSize.height
		};
		return ratio;
	}


}
