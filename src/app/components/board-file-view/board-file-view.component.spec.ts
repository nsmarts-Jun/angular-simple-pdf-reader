import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardFileViewComponent } from './board-file-view.component';

describe('BoardFileViewComponent', () => {
  let component: BoardFileViewComponent;
  let fixture: ComponentFixture<BoardFileViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoardFileViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BoardFileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
