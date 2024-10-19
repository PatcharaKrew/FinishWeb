import { Component, OnInit } from '@angular/core';
import { NgZorroModule } from '../../../shared/ng-zorro.module';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../appointment.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-check',
  standalone: true,
  imports: [NgZorroModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './not-check.component.html',
  styleUrl: './not-check.component.scss'
})
export class NotCheckComponent implements OnInit {

  listOfData: any[] = [];
  filteredData: any[] = [];
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<number>();
  listOfCurrentPageData: readonly any[] = [];
  selectedProgram = '';
  searchText: string = '';
  programs: string[] = [];
  isProcessing: boolean = false;
  isDataSent = false;
  constructor(
    private modal: NzModalService,
    private appointmentService: AppointmentService,
    private fb: NonNullableFormBuilder,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadAppointments();  // ดึงข้อมูลเมื่อคอมโพเนนท์ถูกสร้าง
    this.restoreCheckedState();
  }

  loadAppointments(): void {
    const today = new Date();

    this.appointmentService.getAppointments().subscribe(
      (data) => {
        if (data && data.length > 0) {
          const uniqueAppointments = data.filter((appointment, index, self) =>
            index === self.findIndex((t) => (
              t.appointment_date === appointment.appointment_date && t.user_id === appointment.user_id
            ))
          );

          const upcomingAppointments = uniqueAppointments.map(appointment => ({
            ...appointment,
            isProcessing: false
          })).filter(appointment => new Date(appointment.appointment_date) >= today);

          this.listOfData = upcomingAppointments;
          this.filteredData = upcomingAppointments;
          this.programs = [...new Set(upcomingAppointments.map(item => item.program_name))];
        } else {
          console.error('No data found or data is empty');
        }
      },
      (error) => {
        console.error('Error loading appointments:', error);
      }
    );
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    const hasCheckedItems = this.setOfCheckedId.size > 0;

    if (hasCheckedItems && !this.isDataSent) { // ตรวจสอบว่าไม่ได้ส่งข้อมูลไปแล้ว
      const firstCheckedItem = listOfCurrentPageData.find(item => this.setOfCheckedId.has(item.id));

      if (firstCheckedItem) {
        console.log('Sending the first checked item:', firstCheckedItem);

        // ส่งข้อมูลไปยัง API เฉพาะรายการแรก
        this.appointmentService.createAppointmentStatus(firstCheckedItem).subscribe(
          (result) => {
            console.log('Appointment status created with ID:', result.id);
            this.deleteRow(firstCheckedItem.id);
            this.isDataSent = true;  // ตั้งค่าสถานะเมื่อส่งข้อมูลเสร็จแล้ว
          },
          (error) => {
            console.error('Error creating appointment status:', error);
          }
        );
      }
    } else {
      console.log('No items checked or data already sent.');
    }
  }
  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData.forEach(item => this.updateChecked(item.id, checked));

    this.refreshCheckedStatus();

    if (checked) {
      // ลบรายการซ้ำโดยตรวจสอบ user_id และ appointment_date
      const uniqueItems = this.listOfCurrentPageData.reduce((acc: any[], item) => {
        const isDuplicate = acc.some((el) => el.user_id === item.user_id && el.appointment_date === item.appointment_date);
        if (!isDuplicate) {
          acc.push(item);
        }
        return acc;
      }, []);

      uniqueItems.forEach(item => {
        this.appointmentService.createAppointmentStatus(item).subscribe(
          (result) => {
            console.log('Appointment status created with ID:', result.id);
            this.deleteRow(item.id); // เรียกคำสั่ง onDelete
          },
          (error) => {
            console.error('Error creating appointment status:', error);
          }
        );
      });
    }
  }

  createAppointmentStatus(data: any): void {
    const appointmentStatus = {
      user_id: data.user_id,
      program_name: data.program_name,
      result_program: '', // กำหนดค่า result_program ตามที่คุณต้องการ
      appointment_date: data.appointment_date,
      is_confirmed: true // กำหนดค่าว่า confirmed หรือไม่
    };

    this.appointmentService.createAppointmentStatus(appointmentStatus).subscribe(
      (res) => {
        console.log('Appointment status created successfully', res);
      },
      (error) => {
        console.error('Error creating appointment status:', error);
      }
    );
  }


  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfCurrentPageData.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateChecked(id, checked);
    this.refreshCheckedStatus();
    this.saveCheckedState();
  }

  updateChecked(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  filterData(): void {
    const searchTerm = this.searchText.toLowerCase().trim();

    this.filteredData = this.listOfData.filter(item => {
      const fullName = `${item.first_name} ${item.last_name}`.toLowerCase();
      const matchesSearchTerm = (
        fullName.includes(searchTerm) ||
        item.phone?.toLowerCase().includes(searchTerm)
      );

      const matchesProgram = this.selectedProgram ? item.program_name === this.selectedProgram : true;

      return matchesSearchTerm && matchesProgram;
    });
  }

  viewData(data: any): void {
    const modal = this.modal.create({
      nzTitle: 'ข้อมูลทั้งหมด',
      nzContent: ModalComponent,
      nzFooter: null
    });

    const instance = modal.getContentComponent();
    instance.data = { id: data.id };

    modal.afterClose.subscribe(() => {
      console.log('Modal closed');
    });
  }

  deleteRow(id: number): void {
    this.appointmentService.deleteAppointment(id).subscribe(() => {
      this.filteredData = this.filteredData.filter(item => item.id !== id);
      this.listOfData = this.listOfData.filter(item => item.id !== id);
      this.saveCheckedState();
    }, error => {
      console.error('Error deleting appointment:', error);
    });
  }

  saveCheckedState(): void {
    const checkedArray = Array.from(this.setOfCheckedId);
    localStorage.setItem('checkedItems', JSON.stringify(checkedArray));
  }

  restoreCheckedState(): void {
    const savedCheckedItems = localStorage.getItem('checkedItems');
    if (savedCheckedItems) {
      const checkedArray = JSON.parse(savedCheckedItems);
      this.setOfCheckedId = new Set<number>(checkedArray);
      this.refreshCheckedStatus();
    }
  }

}
