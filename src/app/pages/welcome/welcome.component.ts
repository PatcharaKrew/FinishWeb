import { Component, OnInit, inject } from '@angular/core';
import { NgZorroModule } from '../../../shared/ng-zorro.module';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
@Component({
  selector: 'app-welcome',
  standalone: true,
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  imports: [NgZorroModule, CommonModule, FormsModule, ReactiveFormsModule],
})
export class WelcomeComponent implements OnInit {

  passwordVisible = false;
  password?: string;
  private router = inject(Router);
  private http = inject(HttpClient);
  private message = inject(NzMessageService);

  validateForm: FormGroup<{
    userName: FormControl<string>;
    password: FormControl<string>;
    remember: FormControl<boolean>;
  }> = this.fb.group({
    userName: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [true]
  });

  constructor(private fb: NonNullableFormBuilder) {}

  ngOnInit() {}

  submitForm(): void {
    if (this.validateForm.valid) {
      const { userName, password } = this.validateForm.value;

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      // ส่งคำขอเข้าสู่ระบบไปยัง backend
      this.http.post<{ message: string; adminId: number }>(
        'http://localhost:3000/admin/login',
        { username: userName, password },
        { headers }
      ).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.message.success('เข้าสู่ระบบสำเร็จ');
          // นำทางไปยังหน้า home
          this.router.navigate(['home']);
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.message.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      });

    } else {
      // ถ้าฟอร์มไม่ valid จะแสดงข้อความแจ้งเตือน
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
