import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  private storageKey = 'selectedData'; // กำหนด key สำหรับ Local Storage
  private shouldShowHistoryDataKey = 'shouldShowHistoryData';
  // เพิ่มข้อมูลลงใน selectedData และบันทึกลงใน Local Storage
  addSelectedData(data: any): void {
    const currentData = this.getSelectedData(); // ดึงข้อมูลปัจจุบันจาก Local Storage
    currentData.push(data); // เพิ่มข้อมูลใหม่ลงไป
    this.setSelectedData(currentData); // อัปเดต Local Storage
  }

  // ดึงข้อมูล selectedData จาก Local Storage
  setSelectedData(data: any[]): void {
    console.log('Storing Data in LocalStorage:', data);
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }


  getSelectedData(): any[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  clearSelectedData(): void {
    localStorage.removeItem(this.storageKey);
  }

  setShouldShowHistoryData(value: boolean): void {
    localStorage.setItem(this.shouldShowHistoryDataKey, JSON.stringify(value));
  }

  shouldShowHistoryData(): boolean {
    const data = localStorage.getItem(this.shouldShowHistoryDataKey);
    return data ? JSON.parse(data) : false;
  }

}
