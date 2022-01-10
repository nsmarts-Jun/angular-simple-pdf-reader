import { Component, OnInit } from '@angular/core';

import { ZoomService } from 'src/@pv/services/zoom/zoom.service'

import { ViewInfoService } from 'src/@pv/store/view-info.service';


@Component({
  selector: 'app-board-fabs',
  templateUrl: './board-fabs.component.html',
  styleUrls: ['./board-fabs.component.scss']
})
export class BoardFabsComponent implements OnInit {

  constructor(
    private viewInfoService: ViewInfoService,
    private zoomService: ZoomService

  ) { }

  ngOnInit(): void {

  }


  /**
   * Zoom Button에 대한 동작
   * - viewInfoService의 zoomScale 값 update
   *
   * @param action : 'fitToWidth' , 'fitToPage', 'zoomIn', 'zoomOut'
   */
  clickZoom(action:any){
    console.log(">> Click Zoom: ", action);
    const pageInfo = this.viewInfoService.state.pageInfo;
    //document Number -> 1부터 시작.
    const docNum = pageInfo.currentDocNum;
    const currentPage = pageInfo.currentPage;
    const prevZoomScale = pageInfo.zoomScale;

    const newZoomScale = this.zoomService.calcZoomScale(action, docNum, currentPage, prevZoomScale);
    console.log(newZoomScale)

    this.viewInfoService.updateZoomScale(newZoomScale);

  }

}
