import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotCheckComponent } from './not-check.component';

describe('NotCheckComponent', () => {
  let component: NotCheckComponent;
  let fixture: ComponentFixture<NotCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotCheckComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NotCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
