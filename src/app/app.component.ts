import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { pluck, takeUntil } from 'rxjs/operators';

import { EventData } from 'src/@pv/services/eventBus/event.class';
import { FileService } from 'src/@pv/services/file/file.service';
import { ZoomService } from 'src/@pv/services/zoom/zoom.service'

import { ViewInfoService } from 'src/@pv/store/view-info.service';

import { PdfStorageService } from 'src/@pv/storage/pdf-storage.service';




/**
 * Main Component
 * - Socket 처리
 * - PDF File 변환 처리
 * - PDF, 판서 저장 처리
 * - API 처리
 */

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  private unsubscribe$ = new Subject<void>();
  private meetingId;
  id;

  // Left Side Bar
  leftSideView;

  constructor(
    private viewInfoService: ViewInfoService,
    private pdfStorageService: PdfStorageService,
    private fileService: FileService,
    private zoomService: ZoomService) {

  }

  ngOnInit(): void {

    // sidebar의 view mode : HTML 내에서 사용
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), pluck('leftSideView'))
      .subscribe((leftSideView) => {
        this.leftSideView = leftSideView;

        console.log('[info] current Left Side View: ', leftSideView);
      });

  }
  ///////////////////////////////////////////////////////////

  ngOnDestroy() {
    // unsubscribe all subscription
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

  }

  /**
   * Open Local PDF File
   *  - Board File View Component의 @output
   *  - File upload
   *
   * @param newDocumentFile
   */
  async onDocumentOpened(newDocumentFile) {

    // this.pdfStorageService.memoryRelease();

    const numPages = await this.fileService.openDoc(newDocumentFile);

    const documentInfo = [...this.viewInfoService.state.documentInfo];
    
    for (let item of this.pdfStorageService.pdfVarArray) {
      // 기존에 없던 문서인 경우 추가
      const isExist = documentInfo.some((doc) => doc._id === item._id)
      if (!isExist) {
        documentInfo.push({
          _id: item._id,
          currentPage: 1,
          numPages: item.pdfPages.length,
          // fileName: item.fileName
        });
      }

    };
    // console.log(this.pdfStorageService.pdfVar);
    const obj: any = {
      documentInfo: documentInfo
    }

    // 최초 load인 경우 document ID는 처음 것으로 설정
    if (!this.viewInfoService.state.pageInfo.currentDocId) {
      obj.pageInfo = {
        currentDocId: documentInfo[0]._id,
        currentDocNum: 1,
        currentPage: 1,
        zoomScale: this.zoomService.setInitZoomScale()
      }
    }
    this.viewInfoService.setViewInfo(obj);

  }

}
