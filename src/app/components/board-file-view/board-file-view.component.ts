import { Component, ElementRef, OnInit, Output, QueryList, ViewChildren, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, pluck, takeUntil } from 'rxjs/operators';
import { RenderingService } from 'src/@pv/services/rendering/rendering.service';
import { PdfStorageService } from 'src/@pv/storage/pdf-storage.service';
import { ViewInfoService } from 'src/@pv/store/view-info.service';

@Component({
  selector: 'app-board-file-view',
  templateUrl: './board-file-view.component.html',
  styleUrls: ['./board-file-view.component.scss']
})
export class BoardFileViewComponent implements OnInit {
  private socket;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private renderingService: RenderingService,
    private viewInfoService: ViewInfoService,
    private pdfStorageService: PdfStorageService
  ) {

  }

  // Open된 File을 white-board component로 전달
  @Output() newLocalDocumentFile = new EventEmitter();
  // image element
  @ViewChildren('thumb') thumRef: QueryList<ElementRef>

  documentInfo = [];

  ngOnInit(): void {
    // Document가 Update 된 경우 : File List rendering
    this.viewInfoService.state$
      .pipe(takeUntil(this.unsubscribe$), pluck('documentInfo'), distinctUntilChanged())
      .subscribe(async (documentInfo) => {
        this.documentInfo = documentInfo;
        await new Promise(res => setTimeout(res, 0));

        this.renderFileList(documentInfo);
      });
  }

  ngOnDestory(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
  * PDF File 목록 표시
  * - file 변경시에 전체 다시 그림
  * - image 크기는 고정 size
  *
  * @param documentInfo
  * @returns
  */
  async renderFileList(documentInfo) {
    // File List Background 그리기 : 각 문서의 1page만 그림
    for (let i = 0; i < this.thumRef.toArray().length; i++) {
      await this.renderingService.renderThumbBackground(this.thumRef.toArray()[i].nativeElement, i + 1, 1);
    };
    // 아래와 같은 방식도 사용가능(참고용)
    // https://stackoverflow.com/questions/55737546/access-nth-child-of-viewchildren-querylist-angular
    // this.thumRef.forEach((element, index) => {
    //   this.renderingService.renderThumbBackground(element.nativeElement, index + 1, 1); // element, doc Number, page Number
    // });

  };

  /**
 * File List 에서 각 document 클릭
 *  - 해당 문서의 Thumbanil 표시화면으로 이동
 *  - viewInfo를 update
 * @param docId document ID
 */
  clickPdf(docId) {
    console.log(docId)
    console.log('>> click PDF : change to Thumbnail Mode');
    this.viewInfoService.changeToThumbnailView(docId);
  }


  /**
  * File List 에서 각 document 클릭
  *  - 해당 문서의 Thumbanil 표시화면으로 이동
  *  - viewInfo를 update
  * @param docId document ID
  */
  deletePdf(docId) {
    // thumbnail-container(div) 안에 delete(button)이 존재
    // 2개의 엘리먼트가 동시에 이벤트 발생하는것을 막는 함수 (이벤트 버블링 이슈)
    // https://webisfree.com/2016-06-15/[%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8]-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%B2%84%EB%B8%94%EB%A7%81-%EC%A0%9C%EA%B1%B0%EB%B0%A9%EB%B2%95-stoppropagation()
    event.stopPropagation();
    console.log(docId)
    console.log('>> click PDF : delete');

    console.log(this.pdfStorageService.pdfVarArray);
    const deletedPdfVarArray = this.pdfStorageService.pdfVarArray.filter(x => x._id !== docId)
    console.log(deletedPdfVarArray)
    this.pdfStorageService.setPdfVarArray(deletedPdfVarArray);
    console.log(this.pdfStorageService.pdfVarArray);

    const prevDocumentInfo = [...this.viewInfoService.state.documentInfo];
    const deletedDocumentInfo = prevDocumentInfo.filter(x => x._id !== docId)
    console.log(this.viewInfoService.state.pageInfo)

    const obj: any = {
      documentInfo: deletedDocumentInfo,
      // pdf 삭제 시 제일 첫 pdf 파일 렌더링
      pageInfo:{
        currentDocId : 'delete',
        currentDocNum : 0,
        currentPage : 0,
        zoomScale : 1,
      }
    }


    this.viewInfoService.setViewInfo(obj);
  }
  

  /**
   * 새로운 File Load (Local)
   * - @output으로 main component(white-board.component로 전달)
   * @param event
   * @returns
   */
  handleUploadFileChanged(event) {
    const files: File[] = event.target.files;

    if (event.target.files.length === 0) {
      console.log('file 안들어옴');
      return;
    }

    // @OUTPUT -> white-board component로 전달
    this.newLocalDocumentFile.emit(event.target.files[0]);
  }

}
