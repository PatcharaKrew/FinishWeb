import { kanitBase64 } from '../../../fonts/kanit-font';
import { Component, Input, OnInit } from '@angular/core';
import { NgZorroModule } from '../../../shared/ng-zorro.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectionService } from '../selection.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AppointmentService } from '../../appointment.service';
import { Modal2Component } from '../modal2/modal2.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [NgZorroModule, CommonModule, FormsModule, NzModalModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  selectedData: any[] = [];
  filteredData: any[] = [];
  appointmentDetails: any = null;
  searchText: string = ''; // ตัวแปรสำหรับเก็บค่าค้นหา
  selectedProgram: string = 'ตรวจสุขภาพ'; // ค่าเริ่มต้นที่ตรวจสุขภาพ

  isEditingHealth = false;
  isEditingHiv = false;
  isEditingQuitSmoking = false;

  healthCheckValue = 1;
  hivCheckValue = 1;
  quitSmokingCheckValue = 1;

  // ตัวแปรสำหรับนับจำนวนการนัดหมายแต่ละประเภท
  healthCheckCount: number = 0;
  hivCheckCount: number = 0;
  quitSmokingCount: number = 0;
  totalCheckCount: number = 0;

  // ตัวแปรสำหรับแสดงข้อมูล Pie Chart
  appointmentPieChartData = [
    { name: 'ตรวจสุขภาพ', value: this.healthCheckCount },
    { name: 'HIV', value: this.hivCheckCount },
    { name: 'เลิกบุหรี่', value: this.quitSmokingCount }
  ];

  // ข้อมูลสำหรับแสดง Bar Chart
  riskLevelData: { name: string; series: { name: string; value: number; }[] }[] = [];  // กำหนดชนิดข้อมูลให้ชัดเจน


  toggleEdit(type: string) {
  /**
   * เมื่อมีการเปลี่ยนหน้า จะเรียกฟังก์ชันนี้เพื่ออัปเดตหมายเลขหน้าปัจจุบัน
   * และเรียกฟังก์ชัน filterData อีกครั้งเพื่อให้แน่ใจว่าข้อมูลแสดงตามหน้าที่เลือก
   * @param page หมายเลขหน้าที่เลือก
   */
    if (type === 'health') {
      this.isEditingHealth = !this.isEditingHealth;
      if (!this.isEditingHealth) {
        this.saveQueueLimit('ตรวจสุขภาพ', this.healthCheckValue);
      }
    } else if (type === 'hiv') {
      this.isEditingHiv = !this.isEditingHiv;
      if (!this.isEditingHiv) {
        this.saveQueueLimit('HIV', this.hivCheckValue);
      }
    } else if (type === 'quitSmoking') {
      this.isEditingQuitSmoking = !this.isEditingQuitSmoking;
      if (!this.isEditingQuitSmoking) {
        this.saveQueueLimit('เลิกบุหรี่', this.quitSmokingCheckValue);
      }
    }
  }

  saveQueueLimit(programName: string, maxQueue: number): void {
    this.appointmentService.updateQueueLimit(programName, maxQueue).subscribe(
      () => {
        console.log(`Queue limit for ${programName} updated successfully.`);
      },
      (error) => {
        console.error(`Error updating queue limit for ${programName}:`, error);
      }
    );
  }

  loadQueueLimits(): void {
    this.appointmentService.getQueueLimits().subscribe(
      (data) => {
        data.forEach((item: any) => {
          if (item.program_name === 'ตรวจสุขภาพ') {
            this.healthCheckValue = item.max_queue;
          } else if (item.program_name === 'HIV') {
            this.hivCheckValue = item.max_queue;
          } else if (item.program_name === 'เลิกบุหรี่') {
            this.quitSmokingCheckValue = item.max_queue;
          }
        });
      },
      (error) => {
        console.error('Error loading queue limits:', error);
      }
    );
  }

  constructor(
    private selectionService: SelectionService,
    private modal: NzModalService,
    private appointmentService: AppointmentService,
  ) { }

  ngOnInit(): void {
    this.loadConfirmedAppointments();
    this.loadQueueLimits();

  }

  loadConfirmedAppointments(): void {
    this.appointmentService.getConfirmedAppointments().subscribe(
      (data) => {
        this.selectedData = data;
        this.filterData(); // เรียกฟิลเตอร์เมื่อโหลดข้อมูลเสร็จ
      },
      (error) => {
        console.error('Error loading confirmed appointments:', error);
      }
    );
  }

  filterData(): void {
    const searchTerm = this.searchText.toLowerCase().trim();

    this.filteredData = this.selectedData.filter(item => {
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const matchesProgram = item.program_name === this.selectedProgram;
      return (
        matchesProgram &&
        (fullName.includes(searchTerm) ||
          item.id_card?.toLowerCase().includes(searchTerm) ||
          item.phone?.toLowerCase().includes(searchTerm) ||
          item.first_name?.toLowerCase().includes(searchTerm) ||
          item.last_name?.toLowerCase().includes(searchTerm))
      );
    });

    console.log('Filtered Data:', this.filteredData);
  }

  viewData(data: any): void {
    const modal = this.modal.create({
      nzTitle: 'ข้อมูลทั้งหมด',
      nzContent: Modal2Component,
      nzFooter: null
    });

    const instance = modal.getContentComponent();
    instance.data = { id: data.id };

    modal.afterClose.subscribe(() => {
      console.log('Modal closed');
    });
  }

  deleteRow(id: number): void {
    this.modal.confirm({
      nzTitle: 'คุณต้องการลบข้อมูลนี้หรือไม่?',
      nzContent: '<b>ข้อมูลนี้จะถูกลบอย่างถาวร</b>',
      nzOkText: 'ใช่',
      nzOkType: 'primary',
      nzCancelText: 'ไม่',
      nzOnOk: () => {
        this.appointmentService.deleteAppointmentStatus(id).subscribe(() => {
          this.filteredData = this.filteredData.filter(item => item.id !== id);
          this.selectedData = this.selectedData.filter(item => item.id !== id);
        }, error => {
          console.error('Error deleting appointment status:', error);
        });
      }
    });
  }

  // เพิ่มฟังก์ชันสำหรับการดาวน์โหลด PDF
  downloadPDF(data: any): void {
    this.appointmentService.getAppointmentDetails2(data.id).subscribe(response => {
      const doc = new jsPDF();

      doc.addFileToVFS('Kanit-Regular.ttf', kanitBase64);
      doc.addFont('Kanit-Regular.ttf', 'Kanit', 'normal');
      doc.setFont('Kanit');

      // เพิ่มข้อมูลจาก API ลงใน PDF
      doc.setTextColor(255, 0, 0);
      doc.setFontSize(22);
      const title = 'ข้อมูลผู้เข้าตรวจ';

      // คำนวณตำแหน่ง x ให้อยู่ตรงกลางเอกสาร
      const pageWidth = doc.internal.pageSize.getWidth();  // ความกว้างของหน้าเอกสาร
      const textWidth = doc.getTextWidth(title);  // ความกว้างของข้อความ
      const xPosition = (pageWidth - textWidth) / 2;  // คำนวณตำแหน่งตรงกลาง

      // วาดข้อความที่ตรงกลางแนวนอน
      doc.text(title, xPosition, 20);

      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`ชื่อ-นามสกุล : ${response.title_name} ${response.first_name} ${response.last_name}`, 10, 35);
      doc.text(`เบอร์โทรศัพท์ : ${response.phone}`, 10, 50);
      doc.text(`เลขบัตรประชาชน : ${response.id_card}`, 10, 65);
      doc.text(`วันเกิด : ${response.date_birth}`, 10, 80);
      doc.text(`อายุ : ${response.age}    เพศ : ${response.gender}`, 10, 95);
      doc.text(`ที่อยู่ : ${response.house_number}    ถนน : ${response.street}    หมู่ : ${response.village}`, 10, 110);
      doc.text(`ตำบล : ${response.subdistrict}    อำเภอ : ${response.district}`, 10, 125);
      doc.text(`จังหวัด : ${response.province}    รหัสไปรษณีย์ : ${response.zipcode}`, 10, 140);
      doc.text(`น้ำหนัก : ${response.weight} กก.    ส่วนสูง : ${response.height} ซม.    รอบเอว : ${response.waist} ซม.`, 10, 155);
      doc.text(`BMI : ${response.bmi}      รอบเอวต่อส่วนสูง : ${response.waist_to_height_ratio}`, 10, 170);
      doc.text(`โปรแกรมการนัดหมาย : ${response.program_name}`, 10, 185);
      doc.text(`ผลประเมิน : ${response.result_program}`, 10, 200);

      // ดาวน์โหลด PDF
      doc.save(`${response.program_name} ${response.title_name}${response.first_name} ${response.last_name}.pdf`);
    }, error => {
      console.error('Error fetching appointment details:', error);
    });
  }

}
