import { Component } from '@angular/core';
import { NgZorroModule } from '../../../shared/ng-zorro.module';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AppointmentService } from '../../appointment.service';

interface RiskLevel {
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgZorroModule, CommonModule, FormsModule, NzModalModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  years: number[] = [];
  months: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  selectedYear: number = new Date().getFullYear();
  selectedMonth: string = '';
  selectedRiskYear: number = new Date().getFullYear(); // ปีสำหรับกราฟความเสี่ยง
  showMonthDropdown: boolean = false;

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
  riskLevelSummary: RiskLevel = { highRisk: 0, mediumRisk: 0, lowRisk: 0 }; // ตัวแปรสำหรับเก็บข้อมูลระดับความเสี่ยงรวม

  constructor(
    private modal: NzModalService,
    private appointmentService: AppointmentService,
    private fb: NonNullableFormBuilder
  ) { }

  ngOnInit(): void {
    this.loadYears();
    this.loadQueueLimits();
    this.loadAppointmentCounts();
    this.loadRiskLevelData(); // โหลดข้อมูลระดับความเสี่ยงในแต่ละเดือน
  }

  loadYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 3; i--) { // ปีปัจจุบันถึง 3 ปีก่อนหน้า
      this.years.push(i);
    }
  }

  onYearChange(): void {
    this.showMonthDropdown = true;
    this.loadAppointmentCounts(); // โหลดข้อมูลการนัดหมายตามปีที่เลือก
    this.loadRiskLevelData(); // โหลดข้อมูลความเสี่ยงตามปีที่เลือก
  }

  onMonthChange(): void {
    this.loadMonthlyCounts(); // โหลดข้อมูลการนัดหมายตามเดือนที่เลือก
  }

  loadAppointmentCounts(): void {
    this.appointmentService.getConfirmedAppointments().subscribe(
      (appointments) => {
        // ฟิลเตอร์ตามปี
        const currentYearAppointments = appointments.filter(app => new Date(app.appointment_date).getFullYear() === this.selectedYear);

        // นับจำนวนผู้เข้าตรวจตามประเภท
        this.healthCheckCount = currentYearAppointments.filter(app => app.program_name === 'ตรวจสุขภาพ').length;
        this.hivCheckCount = currentYearAppointments.filter(app => app.program_name === 'HIV').length;
        this.quitSmokingCount = currentYearAppointments.filter(app => app.program_name === 'เลิกบุหรี่').length;
        this.totalCheckCount = currentYearAppointments.length; // จำนวนทั้งหมด

        // อัปเดตข้อมูล Pie Chart
        this.appointmentPieChartData = [
          { name: 'ตรวจสุขภาพ', value: this.healthCheckCount },
          { name: 'HIV', value: this.hivCheckCount },
          { name: 'เลิกบุหรี่', value: this.quitSmokingCount }
        ];
      },
      (error) => {
        console.error('Error loading appointments:', error);
      }
    );
  }

  loadMonthlyCounts(): void {
    this.appointmentService.getConfirmedAppointments().subscribe(appointments => {
      const currentYearAppointments = appointments.filter(app => new Date(app.appointment_date).getFullYear() === this.selectedYear);

      // ฟิลเตอร์ตามเดือน
      const monthIndex = this.months.indexOf(this.selectedMonth);
      const monthlyAppointments = currentYearAppointments.filter(app => new Date(app.appointment_date).getMonth() === monthIndex);

      // นับจำนวนผู้เข้าตรวจตามประเภท
      this.healthCheckCount = monthlyAppointments.filter(app => app.program_name === 'ตรวจสุขภาพ').length;
      this.hivCheckCount = monthlyAppointments.filter(app => app.program_name === 'HIV').length;
      this.quitSmokingCount = monthlyAppointments.filter(app => app.program_name === 'เลิกบุหรี่').length;
      this.totalCheckCount = monthlyAppointments.length; // จำนวนทั้งหมด
    });
  }

  toggleEdit(type: string) {
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

  // โหลดข้อมูล Bar Chart เกี่ยวกับระดับความเสี่ยงในแต่ละเดือน
  loadRiskLevelData(): void {
    this.appointmentService.getConfirmedAppointments().subscribe(
      (appointments) => {
        const riskLevelsByMonth: { [key: string]: RiskLevel } = {};
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        // กำหนดค่าเริ่มต้นสำหรับทุกเดือน
        thaiMonths.forEach((month) => {
          riskLevelsByMonth[month] = { highRisk: 0, mediumRisk: 0, lowRisk: 0 };
        });

        // จัดกลุ่มการนัดหมายตามเดือนและระดับความเสี่ยง
        appointments.forEach(appointment => {
          const monthIndex = new Date(appointment.appointment_date).getMonth();
          const month = thaiMonths[monthIndex];

          if (new Date(appointment.appointment_date).getFullYear() === this.selectedRiskYear) { // ตรวจสอบปี
            if (appointment.result_program === 'เสี่ยงสูง') {
              riskLevelsByMonth[month].highRisk++;
            } else if (appointment.result_program === 'เสี่ยงปานกลาง') {
              riskLevelsByMonth[month].mediumRisk++;
            } else if (appointment.result_program === 'เสี่ยงต่ำ') {
              riskLevelsByMonth[month].lowRisk++;
            }
          }
        });

        // สร้างข้อมูลสำหรับ Bar Chart
        this.riskLevelData = thaiMonths.map(month => ({
          name: month,
          series: [
            { name: 'เสี่ยงสูง', value: riskLevelsByMonth[month].highRisk },
            { name: 'เสี่ยงปานกลาง', value: riskLevelsByMonth[month].mediumRisk },
            { name: 'เสี่ยงต่ำ', value: riskLevelsByMonth[month].lowRisk }
          ]
        }));

        // สรุประดับความเสี่ยงรวมในปีที่เลือก
        this.riskLevelSummary = {
          highRisk: Object.values(riskLevelsByMonth).reduce((sum, current) => sum + current.highRisk, 0),
          mediumRisk: Object.values(riskLevelsByMonth).reduce((sum, current) => sum + current.mediumRisk, 0),
          lowRisk: Object.values(riskLevelsByMonth).reduce((sum, current) => sum + current.lowRisk, 0)
        };
      },
      (error) => {
        console.error('Error loading risk level data:', error);
      }
    );
  }

  getMaxValue(data: any[]): number {
    let maxValue = 0;
    data.forEach(monthData => {
      monthData.series.forEach((series: { value: number; }) => {
        if (series.value > maxValue) {
          maxValue = series.value;
        }
      });
    });
    return Math.ceil(maxValue);  // Round up to ensure it's an integer
  }

  yAxisTickFormat(value: number): string {
    return value % 1 === 0 ? value.toString() : '';  // Show only whole numbers
  }
}
