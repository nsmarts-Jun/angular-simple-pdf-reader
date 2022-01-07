import { Component, ElementRef, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { RenderingService } from 'src/@pv/services/rendering/rendering.service';
import { ViewInfoService } from 'src/@pv/store/view-info.service';
import { EventEmitter } from 'stream';

@Component({
  selector: 'app-board-file-view',
  templateUrl: './board-file-view.component.html',
  styleUrls: ['./board-file-view.component.scss']
})
export class BoardFileViewComponent implements OnInit {
  private socket;
  constructor(
    private renderingService: RenderingService,
    private viewInfoService: ViewInfoService,
  ) {

  }

  // Open된 File을 white-board component로 전달
  @Output() newLocalDocumentFile = new EventEmitter();
  // image element
  @ViewChildren('thumb') thumRef: QueryList<ElementRef>

  documentInfo = [];

  ngOnInit(): void {

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
      for (let i = 0 ; i < this.thumRef.toArray().length; i++) {
        await this.renderingService.renderThumbBackground(this.thumRef.toArray()[i].nativeElement, i+1, 1);
      };
  
      // 아래와 같은 방식도 사용가능(참고용)
      // https://stackoverflow.com/questions/55737546/access-nth-child-of-viewchildren-querylist-angular
      // this.thumRef.forEach((element, index) => {
      //   this.renderingService.renderThumbBackground(element.nativeElement, index + 1, 1); // element, doc Number, page Number
      // });
  
    };

}
