import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexPlotOptions,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { LoaderService } from 'src/app/services/loader.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { CommonModule } from '@angular/common';

export interface monthlyChart {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  responsive: ApexResponsive;
}

@Component({
  selector: 'app-monthly-earnings',
  standalone: true,
  imports:[NgApexchartsModule, MaterialModule, TablerIconsModule,CommonModule],
  templateUrl: './monthly-earnings.component.html',
})
export class AppMonthlyEarningsComponent implements OnInit{
  @ViewChild('chart') chart: ChartComponent = Object.create(null);
  public monthlyChart!: Partial<monthlyChart> | any;
  incomeExpenseList:any [ ]  = []
  currentMonthIncome: number = 0;
previousMonthIncome: number = 0;
percentageChange: number = 0;



  constructor(private firebaseService: FirebaseService, private loaderService: LoaderService) {
    this.monthlyChart = {
      series: [
        {
          name: '',
          color: '#49BEFF',
          data:  Array(7).fill(this.percentageChange) ,
        },
      ],

      chart: {
        type: 'area',
        fontFamily: "'Plus Jakarta Sans', sans-serif;",
        foreColor: '#adb0bb',
        toolbar: {
          show: false,
        },
        height: 60,
        sparkline: {
          enabled: true,
        },
        group: 'sparklines',
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        colors: ['#E8F7FF'],
        type: 'solid',
        opacity: 0.05,
      },
      markers: {
        size: 0,
      },
      tooltip: {
        theme: 'dark',
        x: {
          show: false,
        },
      },
    };
  }

   ngOnInit(): void {
    this.getExpensesList() 
   }

  getExpensesList() {
    this.loaderService.setLoader(true);

    this.firebaseService.getAllExpenses().subscribe((res: any[]) => {
      if (!res) return;

      const userId = localStorage.getItem('userId');
      this.incomeExpenseList = res.filter(item => item.userId === userId);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const previousMonth = prevDate.getMonth();
      const previousYear = prevDate.getFullYear();

      this.currentMonthIncome = 0;
      this.previousMonthIncome = 0;

      this.incomeExpenseList.forEach(item => {
        const itemDate = item.date?.seconds
          ? new Date(item.date.seconds * 1000)
          : new Date(item.date);

        if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
          if (item.accounttype === 'Income') {
            this.currentMonthIncome += Number(item.amount);
          } else if (item.accounttype === 'Expense') {
            this.currentMonthIncome -= Number(item.amount);
          }
        }

        if (itemDate.getMonth() === previousMonth && itemDate.getFullYear() === previousYear) {
          if (item.accounttype === 'Income') {
            this.previousMonthIncome += Number(item.amount);
          } else if (item.accounttype === 'Expense') {
            this.previousMonthIncome -= Number(item.amount);
          }
        }
      });

      if (this.previousMonthIncome === 0) {
        this.percentageChange = this.currentMonthIncome > 0 ? 100 : 0;
      } else {
        const rawChange = ((this.currentMonthIncome - this.previousMonthIncome) / Math.abs(this.previousMonthIncome)) * 100;
         this.percentageChange = Math.max(-100, Math.min(100, rawChange));
      }

      this.loaderService.setLoader(false);
    });
  }

}
