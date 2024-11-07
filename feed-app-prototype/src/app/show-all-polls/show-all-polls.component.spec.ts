import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowAllPollsComponent } from './show-all-polls.component';

describe('ShowAllPollsComponent', () => {
  let component: ShowAllPollsComponent;
  let fixture: ComponentFixture<ShowAllPollsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowAllPollsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowAllPollsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
